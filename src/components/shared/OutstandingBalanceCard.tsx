/**
 * OutstandingBalanceCard - Display customer outstanding balance information
 * 
 * Features:
 * - Customer name and location
 * - Outstanding amount with visual emphasis
 * - Aging indicator badges
 * - Collection status
 * - Days overdue
 * - Credit limit information
 * - Last payment date
 * - Action buttons for payment recording and reminders
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LocationBadge } from "./LocationBadge";
import { CollectionStatusBadge } from "./CollectionStatusBadge";
import type { OutstandingBalance } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { 
  Clock, 
  AlertTriangle, 
  CreditCard
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface OutstandingBalanceCardProps {
  balance: OutstandingBalance;
  onRecordPayment?: (customerId: string) => void;
  onViewHistory?: (customerId: string) => void;
  onAddReminder?: (customerId: string) => void;
  className?: string;
}

// ============================================================================
// Aging Indicator Component
// ============================================================================

interface AgingIndicatorProps {
  daysPastDue: number;
  className?: string;
}

export function AgingIndicator({ daysPastDue, className }: AgingIndicatorProps) {
  const getAgingConfig = (days: number) => {
    if (days <= 30) {
      return {
        label: "0-30 days",
        variant: "default" as const,
        className: "bg-green-100 text-green-800 border-green-200",
        icon: Clock,
      };
    } else if (days <= 60) {
      return {
        label: "31-60 days",
        variant: "default" as const,
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
      };
    } else if (days <= 90) {
      return {
        label: "61-90 days",
        variant: "default" as const,
        className: "bg-orange-100 text-orange-800 border-orange-200",
        icon: AlertTriangle,
      };
    } else {
      return {
        label: "90+ days",
        variant: "destructive" as const,
        className: "",
        icon: AlertTriangle,
      };
    }
  };

  const config = getAgingConfig(daysPastDue);
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} ${className}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}

// ============================================================================
// Outstanding Balance Card Component
// ============================================================================

export function OutstandingBalanceCard({
  balance,
  onRecordPayment,
  onViewHistory,
  className,
}: OutstandingBalanceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate utilization percentage
  const utilizationPercentage = (balance.totalOwed / balance.creditLimit) * 100;
  const isNearLimit = utilizationPercentage >= 80;
  const isOverLimit = utilizationPercentage > 100;

  return (
    <Card className={`overflow-hidden transition-all duration-200 ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header: Customer + Location + Status | Amount */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">
                {balance.customerName}
              </h3>
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                <LocationBadge location={balance.location} size="sm" />
                <CollectionStatusBadge status={balance.collectionStatus} />
              </div>
            </div>
            
            {/* Outstanding Amount */}
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold text-red-600">
                {formatCurrency(balance.totalOwed)}
              </div>
              <div className="text-xs text-muted-foreground">Outstanding</div>
            </div>
          </div>

          {/* Status Row: Aging | Days | Utilization */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <AgingIndicator daysPastDue={balance.daysPastDue} />
            </div>
            
            <div className="flex items-center gap-1 text-xs">
              <span className="font-semibold text-foreground">{balance.daysPastDue}</span>
              <span className="text-muted-foreground">days overdue</span>
            </div>

            <div className="flex items-center gap-1 text-xs ml-auto">
              <span className={`font-semibold ${isOverLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-blue-600'}`}>
                {utilizationPercentage.toFixed(0)}%
              </span>
              <span className="text-muted-foreground">utilized</span>
            </div>
          </div>

          {/* Credit Limit Bar */}
          <div className="space-y-1">
            <div className="w-full bg-slate-700 rounded-sm h-1.5">
              <div 
                className={`h-1.5 rounded-sm transition-all duration-300 ${
                  isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(balance.totalOwed)}</span>
              <span>{formatCurrency(balance.creditLimit)}</span>
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="space-y-1 pt-1 border-t text-xs">
              {balance.lastPaymentDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last payment:</span>
                  <span>{formatDate(balance.lastPaymentDate)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Oldest debt:</span>
                <span>{formatDate(balance.oldestDebtDate)}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t">
            {onRecordPayment && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onRecordPayment(balance.customerId)}
                className="flex-1 text-xs h-8"
              >
                <CreditCard className="h-3 w-3 mr-1" />
                Record
              </Button>
            )}
            
            {onViewHistory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewHistory(balance.customerId)}
                className="flex-1 text-xs h-8"
              >
                History
              </Button>
            )}

            {/* Expand Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs h-8 px-2 shrink-0"
            >
              {isExpanded ? "Less" : "More"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}