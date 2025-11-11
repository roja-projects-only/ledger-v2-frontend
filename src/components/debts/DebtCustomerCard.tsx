import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LocationBadge } from '@/components/shared/LocationBadge';
import type { DebtSummaryItem } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { Eye, CreditCard } from 'lucide-react';

interface DebtCustomerCardProps {
  item: DebtSummaryItem;
  onViewDetails?: (customerId: string) => void;
  onRecordPayment?: (customerId: string) => void;
  className?: string;
}

export function DebtCustomerCard({ item, onViewDetails, onRecordPayment, className }: DebtCustomerCardProps) {
  const isZero = Math.abs(item.balance) < 0.001;
  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold">{item.customerName}</span>
          {/* Optional: show location if provided by caller (narrow type cast) */}
          {(() => {
            const maybe = item as unknown as { location?: string };
            return maybe.location ? <LocationBadge location={maybe.location as unknown as never} size="sm" /> : null;
          })()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Current Balance</div>
            <div className={cn('text-xl font-semibold', isZero ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
              {formatCurrency(item.balance)}
            </div>
          </div>
          <Badge variant={isZero ? 'default' : 'outline'} className={cn(isZero ? 'bg-green-600 hover:bg-green-600' : 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300')}>
            {isZero ? 'Settled' : 'Outstanding'}
          </Badge>
        </div>
        <Separator />
        <div className="flex gap-2">
          <Button variant="outline" className="w-full" onClick={() => onViewDetails?.(item.customerId)}>
            <Eye className="h-4 w-4 mr-1" /> View Details
          </Button>
          <Button variant="default" className="w-full" onClick={() => onRecordPayment?.(item.customerId)} disabled={isZero}>
            <CreditCard className="h-4 w-4 mr-1" /> Record Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default DebtCustomerCard;
