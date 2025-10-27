# Date Handling Quick Reference

## 🚀 Quick Start

```typescript
// Import what you need
import { formatDate, formatDateTime } from '@/lib/utils';
import { DatePicker, DateRangePicker } from '@/components/shared/DatePicker';
import { DateDisplay, RelativeTime } from '@/components/shared/DateDisplay';
import { useDateSelection, useDateRange } from '@/lib/hooks/date';
```

## 📅 Display Dates

```typescript
// Basic formatting
formatDate('2025-01-15') // "Jan 15, 2025"
formatDateTime('2025-01-15T14:30:00Z') // "Jan 15, 2025 2:30 PM"

// Components
<DateDisplay date="2025-01-15" />
<RelativeTime date="2025-01-15T14:30:00Z" />
<DateRangeDisplay startDate="2025-01-01" endDate="2025-01-15" />
```

## 🎯 Date Input

```typescript
// Single date
<DatePicker value={date} onChange={setDate} />
<PastDatePicker value={date} onChange={setDate} /> // No future dates

// Date range
<DateRangePicker
  startDate={start}
  endDate={end}
  onStartDateChange={setStart}
  onEndDateChange={setEnd}
/>
```

## 🎣 State Management

```typescript
// Single date with validation
const {
  selectedDate,
  error,
  selectDate,
  reset
} = useDateSelection({
  maxDate: new Date(),
  validate: (date) => date ? null : 'Required'
});

// Date range with auto-adjustment
const {
  startDate,
  endDate,
  error,
  selectStartDate,
  selectEndDate,
  setPresetRange
} = useDateRange({
  maxRange: 30,
  autoAdjustEnd: true
});
```

## 🔧 Common Patterns

### Replace Manual Formatting
```typescript
// ❌ Old
new Date(dateString).toLocaleDateString()

// ✅ New
formatDate(dateString)
```

### Replace Custom Date Pickers
```typescript
// ❌ Old (lots of boilerplate)
<Popover>
  <PopoverTrigger asChild>
    <Button>{date ? formatDate(date) : 'Pick date'}</Button>
  </PopoverTrigger>
  <PopoverContent>
    <Calendar selected={date} onSelect={setDate} />
  </PopoverContent>
</Popover>

// ✅ New (simple and consistent)
<DatePicker value={date} onChange={setDate} placeholder="Pick date" />
```

### Replace Manual Validation
```typescript
// ❌ Old (error-prone)
const [error, setError] = useState<string>();
const handleDateChange = (date: Date) => {
  if (date > new Date()) {
    setError('Future dates not allowed');
    return;
  }
  setError(undefined);
  setDate(date);
};

// ✅ New (automatic)
const { selectedDate, error, selectDate } = useDateSelection({
  maxDate: new Date()
});
```

## 🎨 Component Variants

### DateDisplay
- `<DateDisplay />` - Basic date display
- `<ShortDate />` - Short format
- `<LongDate />` - Long format with time
- `<RelativeDate />` - Relative format ("today", "yesterday")

### DatePicker
- `<DatePicker />` - Basic date picker
- `<PastDatePicker />` - No future dates
- `<FutureDatePicker />` - No past dates
- `<CompactDatePicker />` - No icon, ghost variant

### DateRangePicker
- `<DateRangePicker />` - Basic range picker
- `<MonthlyDateRangePicker />` - 30-day limit
- `<WeeklyDateRangePicker />` - 7-day limit
- `<PastDateRangePicker />` - No future dates

### RelativeTime
- `<RelativeTime />` - Auto-updating (1 min)
- `<FastRelativeTime />` - Fast updates (30 sec)
- `<StaticRelativeTime />` - No updates (for lists)

## 🎯 Hook Variants

### useDateSelection
- `useDateSelection()` - Basic date selection
- `usePastDateSelection()` - No future dates
- `useFutureDateSelection()` - No past dates
- `useTodayDateSelection()` - Today only

### useDateRange
- `useDateRange()` - Basic range selection
- `usePastDateRange()` - No future dates
- `useMonthlyDateRange()` - 30-day limit
- `useWeeklyDateRange()` - 7-day limit
- `useLastSevenDaysRange()` - Last 7 days preset

## ⚡ Performance Tips

```typescript
// ✅ Use StaticRelativeTime for lists
{items.map(item => (
  <StaticRelativeTime key={item.id} date={item.createdAt} />
))}

// ✅ Use memoization for expensive operations
const formattedDates = useMemo(() => 
  dates.map(date => formatDate(date)), 
  [dates]
);

// ✅ Debounce date range changes
const debouncedRange = useDebounce({ startDate, endDate }, 300);
```

## 🛡️ Error Handling

```typescript
// Always check for errors
const { selectedDate, error, isValid } = useDateSelection();

if (!isValid && error) {
  // Show error to user
  toast.error(error);
}

// Provide fallbacks
const displayDate = selectedDate 
  ? formatDate(toLocalISODate(selectedDate))
  : 'No date selected';
```

## 🌏 Timezone Notes

- All dates are handled in **Asia/Manila** timezone
- Use `createManilaDate()` for timezone-aware Date objects
- Use `getTodayISO()` for current date in Manila timezone
- ISO strings are automatically normalized to Manila timezone

## 🔍 Debugging

```typescript
// Check console for date warnings
console.log('Date validation:', validateDate('2025-01-15'));

// Verify timezone handling
console.log('Today in Manila:', getTodayISO());

// Test date formatting
console.log('Formatted:', formatDate('2025-01-15'));
```

## 📚 Full Documentation

- [Complete Guide](./DATE_HANDLING_GUIDE.md) - Comprehensive documentation
- [Migration Guide](./DATE_MIGRATION_GUIDE.md) - Step-by-step migration help
- TypeScript interfaces in source code for detailed prop information

## 🚨 Common Mistakes

```typescript
// ❌ Don't use browser timezone
new Date().toLocaleDateString()

// ✅ Use Manila timezone
formatDate(getTodayISO())

// ❌ Don't handle undefined in onChange
<DatePicker onChange={setDate} /> // setDate might get undefined

// ✅ Handle undefined properly
<DatePicker onChange={(date) => date && setDate(date)} />

// ❌ Don't forget error handling
const { selectedDate } = useDateSelection();

// ✅ Always check for errors
const { selectedDate, error, isValid } = useDateSelection();
```

---

**Remember**: Consistency is key! Always use the standardized utilities and components for all date operations.