import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LocationBadge } from '@/components/shared/LocationBadge';
import type { DebtSummaryItem, Location } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { Eye, CreditCard } from 'lucide-react';

interface DebtCustomerCardProps {
  item: DebtSummaryItem;
  location?: Location;
  onViewDetails?: (customerId: string) => void;
  onRecordPayment?: (customerId: string) => void;
  className?: string;
}

export function DebtCustomerCard({ item, location, onViewDetails, onRecordPayment, className }: DebtCustomerCardProps) {
  const isZero = Math.abs(item.balance) < 0.001;
  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold">{item.customerName}</span>
          {location && <LocationBadge location={location} size="sm" />}
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
        <div className="flex flex-col md:flex-row gap-2 min-w-0">
          <Button
            variant="outline"
            className="w-full md:flex-1 min-w-0 text-center whitespace-nowrap leading-tight py-2 px-3"
            onClick={() => onViewDetails?.(item.customerId)}
          >
            <Eye className="h-4 w-4 mr-1" />
            <span className="sm:hidden">View</span>
            <span className="hidden sm:inline">View Details</span>
          </Button>
          <Button
            variant="default"
            className="w-full md:flex-1 min-w-0 text-center whitespace-nowrap leading-tight py-2 px-3"
            onClick={() => onRecordPayment?.(item.customerId)}
            disabled={isZero}
          >
            <CreditCard className="h-4 w-4 mr-1" />
            <span className="sm:hidden">Pay</span>
            <span className="hidden sm:inline">Record Payment</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default DebtCustomerCard;
