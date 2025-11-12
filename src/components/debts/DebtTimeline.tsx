import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { DebtTransaction } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PlusCircle, CheckCircle2, Wrench } from 'lucide-react';

interface DebtTimelineProps {
  transactions: DebtTransaction[];
  selectedId?: string;
  className?: string;
}

const tone = {
  CHARGE: {
    icon: PlusCircle,
    dot: 'bg-green-500',
    line: 'border-green-300 dark:border-green-800',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  PAYMENT: {
    icon: CheckCircle2,
    dot: 'bg-blue-500',
    line: 'border-blue-300 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  ADJUSTMENT: {
    icon: Wrench,
    dot: 'bg-orange-500',
    line: 'border-orange-300 dark:border-orange-800',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
} as const;

export function DebtTimeline({ transactions, selectedId, className }: DebtTimelineProps) {
  const items = [...transactions].sort((a,b)=> new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-3 sm:left-4 top-0 bottom-0 border-l border-border/50" />
      <ul className="space-y-3 sm:space-y-4">
        {items.map((t) => {
          const TIcon = tone[t.transactionType].icon;
          const isSelected = selectedId === t.id;
          return (
            <li key={t.id} className="relative pl-10 sm:pl-12">
              <div className={cn('absolute left-1.5 sm:left-2.5 h-2.5 w-2.5 rounded-full', tone[t.transactionType].dot)} />
              <div className={cn('rounded-lg border p-3', isSelected && 'ring-2 ring-primary')}> 
                <div className="flex items-center gap-2">
                  <Badge className={tone[t.transactionType].badge}>{t.transactionType}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(t.transactionDate).toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <TIcon className="h-4 w-4 opacity-70" />
                  <p className="text-sm">
                    {t.transactionType === 'CHARGE' && (
                      <span>
                        Added <b>{t.containers}</b> containers @ <b>{t.unitPrice}</b>
                      </span>
                    )}
                    {t.transactionType === 'PAYMENT' && (
                      <span>
                        Received payment of <b>{t.amount}</b>
                      </span>
                    )}
                    {t.transactionType === 'ADJUSTMENT' && (
                      <span>
                        Adjustment <b>{t.amount}</b>{t.adjustmentReason ? ` — ${t.adjustmentReason}` : ''}
                      </span>
                    )}
                  </p>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Balance after: <b className="text-foreground">{t.balanceAfter.toLocaleString()}</b></span>
                  {t.enteredById && <span>Entered by: {t.enteredById}</span>}
                </div>
                {t.notes && (<p className="mt-1 text-xs text-muted-foreground">Note: {t.notes}</p>)}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default DebtTimeline;
