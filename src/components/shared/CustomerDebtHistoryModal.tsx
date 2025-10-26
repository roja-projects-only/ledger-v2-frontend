/**
 * CustomerDebtHistoryModal - Display detailed payment history for a customer
 *
 * Features:
 * - Complete payment history with dates and amounts
 * - Outstanding balance summary
 * - Credit limit information
 * - Payment recording capability
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { LocationBadge } from "./LocationBadge";
import {
  AgingIndicator,
  CollectionStatusBadge,
} from "./OutstandingBalanceCard";
import { PaymentRecordingModal } from "./PaymentRecordingModal";
import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "@/lib/api/payments.api";
import { queryKeys } from "@/lib/queryKeys";
import type { Payment, OutstandingBalance } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  Clock,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Receipt,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface CustomerDebtHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
  customerName?: string;
  outstandingBalance?: OutstandingBalance;
  onRecordPayment?: (customerId: string) => void;
}

// ============================================================================
// Payment Transactions Component
// ============================================================================

function PaymentTransactions({ payment }: { payment: Payment }) {
  const [isOpen, setIsOpen] = useState(false);

  // Check if payment has transactions
  const hasTransactions =
    payment.transactions && payment.transactions.length > 0;

  if (!hasTransactions) {
    return null;
  }

  const transactions = payment.transactions!;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs h-7 px-2 mt-2"
        >
          {isOpen ? (
            <ChevronDown className="h-3 w-3 mr-1" />
          ) : (
            <ChevronRight className="h-3 w-3 mr-1" />
          )}
          <Receipt className="h-3 w-3 mr-1" />
          {transactions.length} transaction
          {transactions.length !== 1 ? "s" : ""}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="space-y-2 pl-4 border-l-2 border-muted ml-2">
          {transactions.map((transaction, index) => {
            // Calculate running balance
            const previousTransactions = transactions.slice(0, index + 1);
            const totalPaidSoFar = previousTransactions.reduce(
              (sum, t) => sum + t.amount,
              0
            );
            const runningBalance = payment.amount - totalPaidSoFar;

            return (
              <div
                key={transaction.id}
                className="bg-muted/30 rounded-md p-2 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {transaction.paymentMethod}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-green-600">
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>

                {transaction.notes && (
                  <div className="text-xs text-muted-foreground">
                    Note: {transaction.notes}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Balance after: {formatCurrency(Math.max(0, runningBalance))}
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
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
// Customer Debt History Modal Component
// ============================================================================

export function CustomerDebtHistoryModal({
  open,
  onOpenChange,
  customerId,
  customerName,
  outstandingBalance,
  onRecordPayment,
}: CustomerDebtHistoryModalProps) {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Fetch customer payments
  const {
    data: payments,
    isLoading: paymentsLoading,
    error: paymentsError,
  } = useQuery({
    queryKey: queryKeys.payments.customerPayments(customerId || ""),
    queryFn: () => paymentsApi.getCustomerPayments(customerId!),
    enabled: !!customerId && open,
    retry: 1, // Only retry once to avoid excessive requests if endpoint doesn't exist
    select: (data: any) => {
      // Ensure we always return an array
      if (!data) return [];
      if (Array.isArray(data)) return data;
      // If data is an object with a payments property, use that
      if (
        typeof data === "object" &&
        "payments" in data &&
        Array.isArray(data.payments)
      ) {
        return data.payments;
      }
      // If data is an object with a data property, use that
      if (
        typeof data === "object" &&
        "data" in data &&
        Array.isArray(data.data)
      ) {
        return data.data;
      }
      // Fallback to empty array
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

  // Calculate payment statistics
  const paymentStats =
    payments && Array.isArray(payments)
      ? {
          totalPaid: payments.reduce(
            (sum, payment) => sum + payment.paidAmount,
            0
          ),
          totalOwed: payments.reduce((sum, payment) => sum + payment.amount, 0),
          paymentCount: payments.filter((p) => p.paidAmount > 0).length,
          unpaidCount: payments.filter(
            (p) => p.status === "UNPAID" || p.status === "OVERDUE"
          ).length,
        }
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] sm:max-h-[95vh] flex flex-col p-0 gap-0 overflow-hidden mx-0 sm:mx-auto rounded-b-none sm:rounded-lg">
        <div className="flex-shrink-0 p-4 sm:p-6 pb-3 sm:pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <DollarSign className="h-5 w-5" />
              <span className="truncate">
                {customerName
                  ? `${customerName} - Debt History`
                  : "Customer Debt History"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              View complete payment history and outstanding balance details
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-3 sm:space-y-4">
            {/* Customer Summary */}
            {balance && (
              <Card className="border gap-0">
                <CardContent className="p-3 sm:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {/* Customer Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <LocationBadge location={balance.location} size="sm" />
                        <CollectionStatusBadge
                          status={balance.collectionStatus}
                        />
                      </div>
                      {balance.lastPaymentDate && (
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Last payment:{" "}
                          {new Date(
                            balance.lastPaymentDate
                          ).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* Outstanding Balance */}
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-bold text-red-600">
                        {formatCurrency(balance.totalOwed)}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        Outstanding
                      </div>
                      <AgingIndicator
                        daysPastDue={balance.daysPastDue}
                        className="mt-1"
                      />
                    </div>

                    {/* Credit Limit */}
                    <div className="text-center">
                      <div className="text-base sm:text-lg font-semibold">
                        {formatCurrency(balance.creditLimit)}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        Credit Limit
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {(
                          (balance.totalOwed / balance.creditLimit) *
                          100
                        ).toFixed(1)}
                        % utilized
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                    <Button
                      onClick={() => setPaymentModalOpen(true)}
                      className="w-full h-11 sm:h-12"
                      disabled={!balance || balance.totalOwed <= 0}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Record Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment History */}
            <div>
              {/* Payment History Tab */}
              <div>
                <Card className="border gap-0">
                  <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                    <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                      <span>Payment History</span>
                      {paymentStats && (
                        <div className="text-xs sm:text-sm text-muted-foreground font-normal">
                          {paymentStats.paymentCount} payments •{" "}
                          {paymentStats.unpaidCount} unpaid
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div
                      className="h-80 sm:h-96 overflow-y-auto scroll-smooth will-change-transform"
                      style={{ WebkitOverflowScrolling: "touch" }}
                    >
                      {paymentsLoading ? (
                        <div className="space-y-3 p-3 sm:p-4">
                          {[...Array(5)].map((_, index) => (
                            <Skeleton key={index} className="h-16 w-full" />
                          ))}
                        </div>
                      ) : paymentsError ? (
                        <div className="p-3 sm:p-4 text-center text-muted-foreground">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-xs sm:text-sm">
                            Failed to load payment history
                          </p>
                        </div>
                      ) : !payments ||
                        !Array.isArray(payments) ||
                        payments.length === 0 ? (
                        <div className="p-3 sm:p-4 text-center text-muted-foreground">
                          <DollarSign className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-xs sm:text-sm">
                            No payment history found
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {payments.map((payment) => (
                            <div
                              key={payment.id}
                              className="p-3 sm:p-4 hover:bg-muted/50 will-change-colors"
                            >
                              <div className="space-y-2">
                                {/* Status and Date Row */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <PaymentStatusBadge status={payment.status} />
                                  {payment.dueDate && (
                                    <span className="text-xs text-muted-foreground">
                                      Due:{" "}
                                      {new Date(
                                        payment.dueDate
                                      ).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>

                                {/* Created and Paid Dates */}
                                <div className="text-xs text-muted-foreground">
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

                                {/* Amount Info - Always visible */}
                                <div className="flex gap-4 pt-1">
                                  <div>
                                    <div className="font-semibold text-xs">
                                      {formatCurrency(payment.amount)}
                                    </div>
                                  </div>
                                  {payment.paidAmount > 0 && (
                                    <div className="text-xs text-green-600">
                                      Paid: {formatCurrency(payment.paidAmount)}
                                    </div>
                                  )}
                                  {payment.amount > payment.paidAmount && (
                                    <div className="text-xs text-red-600">
                                      Remaining:{" "}
                                      {formatCurrency(
                                        payment.amount - payment.paidAmount
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Notes if present */}
                                {payment.notes && (
                                  <div className="text-xs text-muted-foreground">
                                    Note: {payment.notes}
                                  </div>
                                )}

                                {/* Payment Transactions */}
                                <PaymentTransactions payment={payment} />
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
        </div>

        {/* Payment Recording Modal */}
        <PaymentRecordingModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          customerId={customerId}
          customerName={customerName}
          outstandingBalance={balance}
          onPaymentRecorded={(customerId) => {
            // Call the original callback if provided
            if (onRecordPayment) {
              onRecordPayment(customerId);
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
