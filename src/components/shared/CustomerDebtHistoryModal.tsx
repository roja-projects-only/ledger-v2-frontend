/**
 * CustomerDebtHistoryModal - Display detailed payment history for a customer
 * 
 * Features:
 * - Complete payment history with dates and amounts
 * - Outstanding balance summary
 * - Credit limit information
 * - Reminder notes history
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LocationBadge } from "./LocationBadge";
import { AgingIndicator, CollectionStatusBadge } from "./OutstandingBalanceCard";
import { useQuery } from "@tanstack/react-query";
import { paymentsApi, reminderNotesApi } from "@/lib/api/payments.api";
import { queryKeys } from "@/lib/queryKeys";
import type { Payment, OutstandingBalance } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { 
  DollarSign, 
  Clock,
  MessageSquare,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle
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
  const [activeTab, setActiveTab] = useState("payments");

  // Fetch customer payments
  const {
    data: payments,
    isLoading: paymentsLoading,
    error: paymentsError,
  } = useQuery({
    queryKey: queryKeys.payments.customerPayments(customerId || ""),
    queryFn: () => paymentsApi.getCustomerPayments(customerId!),
    enabled: !!customerId && open,
  });

  // Fetch customer reminders
  const {
    data: reminders,
    isLoading: remindersLoading,
    error: remindersError,
  } = useQuery({
    queryKey: queryKeys.reminders.customerReminders(customerId || ""),
    queryFn: () => reminderNotesApi.getCustomerReminders(customerId!),
    enabled: !!customerId && open,
  });

  // Fetch current outstanding balance if not provided
  const {
    data: currentBalance,
  } = useQuery({
    queryKey: queryKeys.payments.customerOutstanding(customerId || ""),
    queryFn: () => paymentsApi.getCustomerOutstanding(customerId!),
    enabled: !!customerId && open && !outstandingBalance,
  });

  const balance = outstandingBalance || currentBalance;

  // Calculate payment statistics
  const paymentStats = payments ? {
    totalPaid: payments.reduce((sum, payment) => sum + payment.paidAmount, 0),
    totalOwed: payments.reduce((sum, payment) => sum + payment.amount, 0),
    paymentCount: payments.filter(p => p.paidAmount > 0).length,
    unpaidCount: payments.filter(p => p.status === "UNPAID" || p.status === "OVERDUE").length,
  } : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {customerName ? `${customerName} - Debt History` : "Customer Debt History"}
          </DialogTitle>
          <DialogDescription>
            View complete payment history and outstanding balance details
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Customer Summary */}
          {balance && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Customer Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <LocationBadge location={balance.location} size="sm" />
                      <CollectionStatusBadge status={balance.collectionStatus} />
                    </div>
                    {balance.lastPaymentDate && (
                      <div className="text-sm text-muted-foreground">
                        Last payment: {new Date(balance.lastPaymentDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Outstanding Balance */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(balance.totalOwed)}
                    </div>
                    <div className="text-sm text-muted-foreground">Outstanding</div>
                    <AgingIndicator daysPastDue={balance.daysPastDue} className="mt-1" />
                  </div>

                  {/* Credit Limit */}
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {formatCurrency(balance.creditLimit)}
                    </div>
                    <div className="text-sm text-muted-foreground">Credit Limit</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {((balance.totalOwed / balance.creditLimit) * 100).toFixed(1)}% utilized
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                {onRecordPayment && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      onClick={() => onRecordPayment(customerId!)}
                      className="w-full"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Record Payment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tabs for different views */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="payments">Payment History</TabsTrigger>
              <TabsTrigger value="reminders">Reminder Notes</TabsTrigger>
            </TabsList>

            {/* Payment History Tab */}
            <TabsContent value="payments" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Payment History</span>
                    {paymentStats && (
                      <div className="text-sm text-muted-foreground">
                        {paymentStats.paymentCount} payments • {paymentStats.unpaidCount} unpaid
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    {paymentsLoading ? (
                      <div className="space-y-3 p-4">
                        {[...Array(5)].map((_, index) => (
                          <Skeleton key={index} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : paymentsError ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>Failed to load payment history</p>
                      </div>
                    ) : !payments || payments.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <DollarSign className="h-8 w-8 mx-auto mb-2" />
                        <p>No payment history found</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {payments.map((payment) => (
                          <div key={payment.id} className="p-4 hover:bg-muted/50">
                            <div className="flex items-center justify-between gap-4">
                              {/* Payment Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <PaymentStatusBadge status={payment.status} />
                                  {payment.dueDate && (
                                    <span className="text-xs text-muted-foreground">
                                      Due: {new Date(payment.dueDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="text-sm text-muted-foreground">
                                  Created: {new Date(payment.createdAt).toLocaleDateString()}
                                  {payment.paidAt && (
                                    <span className="ml-2">
                                      • Paid: {new Date(payment.paidAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>

                                {payment.notes && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    Note: {payment.notes}
                                  </div>
                                )}
                              </div>

                              {/* Amount Info */}
                              <div className="text-right">
                                <div className="font-semibold">
                                  {formatCurrency(payment.amount)}
                                </div>
                                {payment.paidAmount > 0 && (
                                  <div className="text-sm text-green-600">
                                    Paid: {formatCurrency(payment.paidAmount)}
                                  </div>
                                )}
                                {payment.amount > payment.paidAmount && (
                                  <div className="text-sm text-red-600">
                                    Remaining: {formatCurrency(payment.amount - payment.paidAmount)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reminder Notes Tab */}
            <TabsContent value="reminders" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Reminder Notes</span>
                    {reminders && (
                      <div className="text-sm text-muted-foreground">
                        {reminders.length} reminders
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    {remindersLoading ? (
                      <div className="space-y-3 p-4">
                        {[...Array(3)].map((_, index) => (
                          <Skeleton key={index} className="h-20 w-full" />
                        ))}
                      </div>
                    ) : remindersError ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>Failed to load reminder notes</p>
                      </div>
                    ) : !reminders || reminders.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                        <p>No reminder notes found</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {reminders.map((reminder) => (
                          <div key={reminder.id} className="p-4 hover:bg-muted/50">
                            <div className="flex items-start gap-3">
                              <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium mb-1">
                                  {reminder.note}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(reminder.reminderDate).toLocaleDateString()} at{" "}
                                  {new Date(reminder.reminderDate).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}