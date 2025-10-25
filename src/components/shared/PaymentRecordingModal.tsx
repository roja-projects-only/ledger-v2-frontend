/**
 * PaymentRecordingModal - Modal for recording cash payments received from customers
 *
 * Features:
 * - Form to record cash payments received
 * - Support partial and full payment amounts
 * - Show payment history for customer
 * - Display remaining balance after payment
 * - Real-time balance calculations
 * - Payment confirmation and validation
 */

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NumberInput } from "@/components/shared/NumberInput";
import { LocationBadge } from "./LocationBadge";
import {
  AgingIndicator,
  CollectionStatusBadge,
} from "./OutstandingBalanceCard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "@/lib/api/payments.api";
import { queryKeys } from "@/lib/queryKeys";
import { notify } from "@/lib/notifications";
import { cn, formatCurrency } from "@/lib/utils";
import { getSemanticColor } from "@/lib/colors";
import type { Payment, OutstandingBalance, PaymentMethod } from "@/lib/types";
import {
  Clock,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  History,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface PaymentRecordingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
  customerName?: string;
  outstandingBalance?: OutstandingBalance;
  onPaymentRecorded?: (customerId: string, amount: number) => void;
}

// ============================================================================
// Payment Status Badge Component
// ============================================================================

function PaymentStatusBadge({ status }: { status: Payment["status"] }) {
  const getStatusConfig = (status: Payment["status"]) => {
    switch (status) {
      case "PAID":
        return {
          label: "Paid",
          variant: "default" as const,
          className: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
        };
      case "PARTIAL":
        return {
          label: "Partial",
          variant: "default" as const,
          className: "bg-blue-100 text-blue-800 border-blue-200",
          icon: Clock,
        };
      case "UNPAID":
        return {
          label: "Unpaid",
          variant: "default" as const,
          className: "bg-red-100 text-red-800 border-red-200",
          icon: XCircle,
        };
      case "OVERDUE":
        return {
          label: "Overdue",
          variant: "destructive" as const,
          className: "",
          icon: AlertCircle,
        };
      case "COLLECTION":
        return {
          label: "Collection",
          variant: "destructive" as const,
          className: "",
          icon: AlertCircle,
        };
      default:
        return {
          label: status,
          variant: "outline" as const,
          className: "",
          icon: Clock,
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}

// ============================================================================
// Payment Recording Modal Component
// ============================================================================

export function PaymentRecordingModal({
  open,
  onOpenChange,
  customerId,
  customerName,
  outstandingBalance,
  onPaymentRecorded,
}: PaymentRecordingModalProps) {
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod] = useState<PaymentMethod>("CASH"); // Only cash supported
  const [notes, setNotes] = useState<string>("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>("");
  const [errors, setErrors] = useState<{
    amount?: string;
    payment?: string;
  }>({});

  const paymentAmountRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const errorTone = getSemanticColor("error");

  // Fetch customer payments
  const {
    data: payments,
    isLoading: paymentsLoading,
    error: paymentsError,
  } = useQuery({
    queryKey: queryKeys.payments.customerPayments(customerId || ""),
    queryFn: () => paymentsApi.getCustomerPayments(customerId!),
    enabled: !!customerId && open,
    retry: 1,
    select: (data: any) => {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (
        typeof data === "object" &&
        "payments" in data &&
        Array.isArray(data.payments)
      ) {
        return data.payments;
      }
      if (
        typeof data === "object" &&
        "data" in data &&
        Array.isArray(data.data)
      ) {
        return data.data;
      }
      return [];
    },
  });

  // Fetch current outstanding balance if not provided
  const { data: currentBalance } = useQuery({
    queryKey: queryKeys.payments.customerOutstanding(customerId || ""),
    queryFn: () => paymentsApi.getCustomerOutstanding(customerId!),
    enabled: !!customerId && open && !outstandingBalance,
  });

  const balance = outstandingBalance || currentBalance;

  // Get unpaid payments for selection
  const unpaidPayments =
    payments?.filter(
      (payment: Payment) =>
        payment.status === "UNPAID" ||
        payment.status === "PARTIAL" ||
        payment.status === "OVERDUE"
    ) || [];

  // Calculate payment details
  const paymentAmountNum = parseFloat(paymentAmount) || 0;
  const selectedPayment = payments?.find(
    (p: Payment) => p.id === selectedPaymentId
  );
  const remainingOnPayment = selectedPayment
    ? selectedPayment.amount - selectedPayment.paidAmount
    : 0;
  const newBalanceAfterPayment = balance
    ? Math.max(0, balance.totalOwed - paymentAmountNum)
    : 0;

  // Auto-select first unpaid payment when modal opens
  useEffect(() => {
    if (open && unpaidPayments.length > 0 && !selectedPaymentId) {
      setSelectedPaymentId(unpaidPayments[0].id);
    }
  }, [open, unpaidPayments, selectedPaymentId]);

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async (data: {
      paymentId: string;
      amount: number;
      notes?: string;
    }) => {
      return paymentsApi.recordPayment(data.paymentId, {
        amount: data.amount,
        paymentMethod,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.payments.customerPayments(customerId!),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.payments.customerOutstanding(customerId!),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.payments.outstanding(),
      });

      notify.success(
        `Payment of ${formatCurrency(paymentAmountNum)} recorded successfully`
      );

      // Call callback if provided
      if (onPaymentRecorded) {
        onPaymentRecorded(customerId!, paymentAmountNum);
      }

      // Reset form
      setPaymentAmount("");
      setNotes("");
      setErrors({});

      // Close modal
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Failed to record payment:", error);
      notify.error(error?.message || "Failed to record payment");
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setPaymentAmount("");
      setNotes("");
      setErrors({});
      setSelectedPaymentId("");
      // Focus payment amount input after a short delay
      setTimeout(() => {
        paymentAmountRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Handle quick amount selection
  const handleQuickAmount = (amount: number) => {
    setPaymentAmount(amount.toString());
    setErrors((prev) => ({ ...prev, amount: undefined }));
  };

  // Handle full payment
  const handleFullPayment = () => {
    if (selectedPayment) {
      const fullAmount = selectedPayment.amount - selectedPayment.paidAmount;
      setPaymentAmount(fullAmount.toString());
      setErrors((prev) => ({ ...prev, amount: undefined }));
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationErrors: {
      amount?: string;
      payment?: string;
    } = {};

    if (!selectedPaymentId) {
      validationErrors.payment = "Please select a payment to record against";
    }

    if (!paymentAmount || paymentAmountNum <= 0) {
      validationErrors.amount = "Enter a valid payment amount";
    } else if (selectedPayment && paymentAmountNum > remainingOnPayment) {
      validationErrors.amount = `Payment amount cannot exceed remaining balance of ${formatCurrency(
        remainingOnPayment
      )}`;
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    recordPaymentMutation.mutate({
      paymentId: selectedPaymentId,
      amount: paymentAmountNum,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="flex-shrink-0 p-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Record Payment - {customerName || "Customer"}
            </DialogTitle>
            <DialogDescription>
              Record a cash payment received from the customer
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 space-y-4">
            {/* Customer Summary - Compact */}
            {balance && (
              <Card className="border-2 gap-0 sm:gap-0">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Current Outstanding */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(balance.totalOwed)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Current Outstanding
                      </div>
                    </div>

                    {/* After Payment */}
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-green-600">
                        {formatCurrency(newBalanceAfterPayment)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        After Payment
                      </div>
                      {paymentAmountNum > 0 && (
                        <div className="text-xs text-muted-foreground">
                          -{formatCurrency(paymentAmountNum)}
                        </div>
                      )}
                    </div>

                    {/* Location & Status */}
                    <div className="flex flex-col items-center justify-center gap-1">
                      <LocationBadge location={balance.location} size="sm" />
                      <CollectionStatusBadge
                        status={balance.collectionStatus}
                      />
                    </div>

                    {/* Aging Info */}
                    <div className="flex items-center justify-center">
                      <AgingIndicator daysPastDue={balance.daysPastDue} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Selection */}
            <div className="space-y-2">
              <Label className="font-semibold text-sm">
                Select Payment to Apply To *
              </Label>
              {unpaidPayments.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No unpaid payments found for this customer.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-48 overflow-y-auto">
                    <div className="space-y-1 p-2">
                      {unpaidPayments.map((payment: Payment) => (
                        <div
                          key={payment.id}
                          className={cn(
                            "p-3 border rounded-lg cursor-pointer transition-all text-sm",
                            selectedPaymentId === payment.id
                              ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                              : "border-border hover:bg-muted/50"
                          )}
                          onClick={() => setSelectedPaymentId(payment.id)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <PaymentStatusBadge status={payment.status} />
                              {payment.dueDate && (
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  Due:{" "}
                                  {new Date(
                                    payment.dueDate
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-bold">
                                {formatCurrency(
                                  payment.amount - payment.paidAmount
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                remaining
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {errors.payment && (
                <p
                  className={cn("text-sm", errorTone.text)}
                  role="alert"
                >
                  {errors.payment}
                </p>
              )}
            </div>

            {/* Payment Amount */}
            <div className="space-y-2">
              <Label
                htmlFor="payment-amount"
                className="font-semibold text-sm"
              >
                Payment Amount (₱) *
              </Label>
              <NumberInput
                value={paymentAmount}
                onChange={setPaymentAmount}
                min={1}
                step={1}
                quickValues={[]}
                placeholder="0"
                inputRef={paymentAmountRef}
                aria-label="Payment amount"
                className={cn(
                  "text-lg h-12 text-center font-semibold",
                  errors.amount && cn(errorTone.border, errorTone.ring)
                )}
              />
              {errors.amount && (
                <p
                  className={cn("text-sm", errorTone.text)}
                  role="alert"
                >
                  {errors.amount}
                </p>
              )}
            </div>

            {/* Quick Amount Buttons - Simplified */}
            {selectedPayment && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground font-medium">
                  Quick amounts:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFullPayment}
                    className="h-12 flex flex-col items-center justify-center gap-1"
                  >
                    <span className="font-semibold text-xs">Full</span>
                    <span className="text-xs">
                      {formatCurrency(remainingOnPayment)}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleQuickAmount(
                        Math.floor(remainingOnPayment / 2)
                      )
                    }
                    className="h-12 flex flex-col items-center justify-center gap-1"
                  >
                    <span className="font-semibold text-xs">Half</span>
                    <span className="text-xs">
                      {formatCurrency(
                        Math.floor(remainingOnPayment / 2)
                      )}
                    </span>
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[500, 1000, 2000].map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAmount(amount)}
                      className="h-10 text-xs font-semibold"
                    >
                      ₱{(amount / 1000).toFixed(1).replace('.0', 'K')}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[5000, 10000].map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAmount(amount)}
                      className="h-10 text-xs font-semibold"
                    >
                      ₱{(amount / 1000).toFixed(0)}K
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label
                htmlFor="payment-notes"
                className="font-semibold text-sm"
              >
                Notes (Optional)
              </Label>
              <Textarea
                id="payment-notes"
                placeholder="Additional notes about this payment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
            </div>

            {/* Recent Payment History - Collapsible */}
            <Card className="border-2 gap-0 sm:gap-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Recent Payments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-32 overflow-y-auto divide-y border-t">
                  {paymentsLoading ? (
                    <div className="space-y-2 p-3">
                      {[...Array(3)].map((_, index) => (
                        <Skeleton key={index} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : paymentsError || !payments || payments.length === 0 ? (
                    <div className="p-3 text-center text-muted-foreground text-xs">
                      No payment history
                    </div>
                  ) : (
                    payments.slice(0, 5).map((payment: Payment) => (
                      <div
                        key={payment.id}
                        className="p-3 hover:bg-muted/50 transition-colors text-xs"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <PaymentStatusBadge status={payment.status} />
                          <div className="font-bold">
                            {formatCurrency(payment.amount)}
                          </div>
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {new Date(
                            payment.createdAt
                          ).toLocaleDateString()}
                          {payment.paidAmount > 0 && (
                            <span className="ml-2 text-green-600">
                              Paid: {formatCurrency(payment.paidAmount)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons - Sticky Footer */}
        <div className="flex-shrink-0 border-t p-4 gap-3 flex bg-background">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e as any);
            }}
            disabled={
              recordPaymentMutation.isPending ||
              unpaidPayments.length === 0
            }
            className="flex-1 font-semibold"
          >
            {recordPaymentMutation.isPending ? (
              <>Recording...</>
            ) : (
              <>Record Payment</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
