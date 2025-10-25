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
import type { OutstandingBalance, CollectionStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { 
  Clock, 
  AlertTriangle, 
  MessageSquare,
  Calendar,
  CreditCard
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface OutstandingBalanceCardProps {
  balance: OutstandingBalance;
  onRecordPayment?: (customerId: string) => void;
  onAddReminder?: (customerId: string) => void;
  onViewHistory?: (customerId: string) => void;
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
// Collection Status Badge Component
// ============================================================================

interface CollectionStatusBadgeProps {
  status: CollectionStatus;
  className?: string;
}

export function CollectionStatusBadge({ status, className }: CollectionStatusBadgeProps) {
  const getStatusConfig = (status: CollectionStatus) => {
    switch (status) {
      case "ACTIVE":
        return {
          label: "Active",
          variant: "default" as const,
          className: "bg-green-100 text-green-800 border-green-200",
        };
      case "OVERDUE":
        return {
          label: "Overdue",
          variant: "default" as const,
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        };
      case "SUSPENDED":
        return {
          label: "Suspended",
          variant: "destructive" as const,
          className: "",
        };
      default:
        return {
          label: status,
          variant: "outline" as const,
          className: "",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} ${className}`}
    >
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
  onAddReminder,
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
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-3 sm:space-y-4">
          {/* Header Row - Customer Info */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate text-base sm:text-lg">
                {balance.customerName}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <LocationBadge location={balance.location} size="sm" />
                <CollectionStatusBadge status={balance.collectionStatus} />
              </div>
            </div>
            
            {/* Outstanding Amount - Prominent Display */}
            <div className="text-right sm:text-right">
              <div className="text-xl sm:text-2xl font-bold text-red-600">
                {formatCurrency(balance.totalOwed)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Outstanding
              </div>
            </div>
          </div>

          {/* Aging and Days Overdue */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <AgingIndicator daysPastDue={balance.daysPastDue} />
            
            <div className="text-right">
              <div className="text-base sm:text-lg font-semibold">
                {balance.daysPastDue}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                days overdue
              </div>
            </div>
          </div>

          {/* Credit Limit Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Credit Utilization</span>
              <span className={`font-medium ${isOverLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                {utilizationPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(balance.totalOwed)} owed</span>
              <span>{formatCurrency(balance.creditLimit)} limit</span>
            </div>
          </div>

          {/* Additional Details (Expandable) */}
          {isExpanded && (
            <div className="space-y-3 pt-3 border-t">
              {/* Last Payment Date */}
              {balance.lastPaymentDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last payment:</span>
                  <span>{new Date(balance.lastPaymentDate).toLocaleDateString()}</span>
                </div>
              )}

              {/* Oldest Debt Date */}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Oldest debt:</span>
                <span>{new Date(balance.oldestDebtDate).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t">
            {onRecordPayment && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onRecordPayment(balance.customerId)}
                className="min-w-0"
              >
                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                <span className="truncate">Record Payment</span>
              </Button>
            )}
            
            {onAddReminder && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddReminder(balance.customerId)}
                className="min-w-0"
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                <span className="truncate">Add Reminder</span>
              </Button>
            )}
            
            {onViewHistory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewHistory(balance.customerId)}
                className="min-w-0"
              >
                <span className="truncate">View History</span>
              </Button>
            )}

            {/* Expand/Collapse Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="col-span-1"
            >
              {isExpanded ? "Less" : "More"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}