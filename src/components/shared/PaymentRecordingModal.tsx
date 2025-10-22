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
  DollarSign,
  Clock,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calculator,
  History,
  Banknote,
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
      <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-full h-[95vh] flex flex-col p-0 gap-0">
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

        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-6 py-6">
            {/* Customer Summary */}
            {balance && (
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Customer Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <LocationBadge location={balance.location} size="sm" />
                        <CollectionStatusBadge
                          status={balance.collectionStatus}
                        />
                      </div>
                      {balance.lastPaymentDate && (
                        <div className="text-sm text-muted-foreground">
                          Last payment:{" "}
                          {new Date(
                            balance.lastPaymentDate
                          ).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* Current Outstanding */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">
                        {formatCurrency(balance.totalOwed)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Current Outstanding
                      </div>
                      <AgingIndicator
                        daysPastDue={balance.daysPastDue}
                        className="mt-2"
                      />
                    </div>

                    {/* After Payment */}
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-green-600">
                        {formatCurrency(newBalanceAfterPayment)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        After Payment
                      </div>
                      {paymentAmountNum > 0 && (
                        <div className="text-sm text-muted-foreground mt-1">
                          -{formatCurrency(paymentAmountNum)}
                        </div>
                      )}
                    </div>

                    {/* Payment Method Info */}
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
                        <Banknote className="h-5 w-5" />
                        <span className="font-medium">Cash Payment</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Content - Two Column Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Left Column - Payment Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Record Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Payment Selection */}
                    <div className="space-y-2">
                      <Label className="text-lg font-semibold">
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
                        <div className="space-y-3 max-h-60 overflow-y-auto border rounded-lg p-4">
                          {unpaidPayments.map((payment: Payment) => (
                            <div
                              key={payment.id}
                              className={cn(
                                "p-5 border rounded-lg cursor-pointer transition-all",
                                selectedPaymentId === payment.id
                                  ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-md"
                                  : "border-border hover:bg-muted/50 hover:shadow-sm"
                              )}
                              onClick={() => setSelectedPaymentId(payment.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <PaymentStatusBadge status={payment.status} />
                                  {payment.dueDate && (
                                    <span className="text-sm text-muted-foreground">
                                      Due:{" "}
                                      {new Date(
                                        payment.dueDate
                                      ).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-xl font-bold">
                                    {formatCurrency(
                                      payment.amount - payment.paidAmount
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    remaining
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
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
                        className="text-lg font-semibold"
                      >
                        Payment Amount (₱) *
                      </Label>
                      <NumberInput
                        value={paymentAmount}
                        onChange={setPaymentAmount}
                        min={0.01}
                        step={0.01}
                        placeholder="0.00"
                        inputRef={paymentAmountRef}
                        aria-label="Payment amount"
                        className={cn(
                          "text-xl h-14 text-center font-semibold",
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

                      {/* Quick Amount Buttons */}
                      {selectedPayment && (
                        <div className="space-y-4">
                          <div className="text-sm text-muted-foreground font-medium">
                            Quick amounts:
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="lg"
                              onClick={handleFullPayment}
                              className="h-14 flex flex-col"
                            >
                              <span className="font-semibold">
                                Full Payment
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatCurrency(remainingOnPayment)}
                              </span>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="lg"
                              onClick={() =>
                                handleQuickAmount(
                                  Math.floor(remainingOnPayment / 2)
                                )
                              }
                              className="h-14 flex flex-col"
                            >
                              <span className="font-semibold">
                                Half Payment
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatCurrency(
                                  Math.floor(remainingOnPayment / 2)
                                )}
                              </span>
                            </Button>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            {[100, 200, 500, 1000].map((amount) => (
                              <Button
                                key={amount}
                                type="button"
                                variant="outline"
                                size="lg"
                                onClick={() => handleQuickAmount(amount)}
                                className="h-12 font-semibold"
                              >
                                ₱{amount}
                              </Button>
                            ))}
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {[2000, 5000, 10000].map((amount) => (
                              <Button
                                key={amount}
                                type="button"
                                variant="outline"
                                size="lg"
                                onClick={() => handleQuickAmount(amount)}
                                className="h-12 font-semibold"
                              >
                                ₱{amount}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="payment-notes"
                        className="text-lg font-semibold"
                      >
                        Notes (Optional)
                      </Label>
                      <Textarea
                        id="payment-notes"
                        placeholder="Additional notes about this payment..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="resize-none text-base"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 h-14 text-base"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          recordPaymentMutation.isPending ||
                          unpaidPayments.length === 0
                        }
                        className="flex-1 h-14 text-base font-semibold"
                      >
                        {recordPaymentMutation.isPending ? (
                          <>Recording Payment...</>
                        ) : (
                          <>Record Payment</>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Right Column - Payment History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Recent Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[600px] overflow-y-auto">
                    {paymentsLoading ? (
                      <div className="space-y-4 p-6">
                        {[...Array(5)].map((_, index) => (
                          <Skeleton key={index} className="h-24 w-full" />
                        ))}
                      </div>
                    ) : paymentsError ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                        <p className="text-lg">
                          Failed to load payment history
                        </p>
                      </div>
                    ) : !payments || payments.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <DollarSign className="h-12 w-12 mx-auto mb-4" />
                        <p className="text-lg">No payment history found</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {payments.slice(0, 15).map((payment: Payment) => (
                          <div
                            key={payment.id}
                            className="p-6 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-6">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-3">
                                  <PaymentStatusBadge status={payment.status} />
                                  {payment.dueDate && (
                                    <span className="text-sm text-muted-foreground">
                                      Due:{" "}
                                      {new Date(
                                        payment.dueDate
                                      ).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>

                                <div className="text-sm text-muted-foreground mb-2">
                                  Created:{" "}
                                  {new Date(
                                    payment.createdAt
                                  ).toLocaleDateString()}
                                  {payment.paidAt && (
                                    <span className="ml-2">
                                      • Paid:{" "}
                                      {new Date(
                                        payment.paidAt
                                      ).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>

                                {payment.notes && (
                                  <div className="text-sm text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                                    Note: {payment.notes}
                                  </div>
                                )}
                              </div>

                              <div className="text-right">
                                <div className="text-xl font-bold">
                                  {formatCurrency(payment.amount)}
                                </div>
                                {payment.paidAmount > 0 && (
                                  <div className="text-sm text-green-600 font-medium">
                                    Paid: {formatCurrency(payment.paidAmount)}
                                  </div>
                                )}
                                {payment.amount > payment.paidAmount && (
                                  <div className="text-sm text-red-600 font-medium">
                                    Remaining:{" "}
                                    {formatCurrency(
                                      payment.amount - payment.paidAmount
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
