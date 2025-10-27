# Date Handling Guide

This guide provides comprehensive documentation for the standardized date handling system in the Water Refilling Ledger application.

## Table of Contents

- [Overview](#overview)
- [Core Utilities](#core-utilities)
- [Display Components](#display-components)
- [Input Components](#input-components)
- [State Management Hooks](#state-management-hooks)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The date handling system provides a unified approach to managing dates and times across the application with:

- **Timezone Consistency**: All dates use Asia/Manila timezone
- **Standardized Formatting**: Consistent date display formats
- **Comprehensive Validation**: Built-in error handling and validation
- **Accessibility**: Full ARIA support and keyboard navigation
- **Performance**: Optimized components with proper cleanup

## Core Utilities

### Date Formatting Functions

Located in `src/lib/utils.ts`:

```typescript
import { formatDate, formatDateTime, formatRelativeDate } from '@/lib/utils';

// Basic date formatting
const dateString = formatDate('2025-01-15'); // "Jan 15, 2025"
const dateTimeString = formatDateTime('2025-01-15T14:30:00Z'); // "Jan 15, 2025 2:30 PM"

// Relative date formatting
const relativeString = formatRelativeDate('2025-01-15', { 
  maxDays: 7, 
  includeTime: true 
}); // "Today at 2:30 PM" or "2 days ago at 2:30 PM"
```

### Date Creation and Conversion

```typescript
import { createManilaDate, toLocalISODate, getTodayISO } from '@/lib/utils';

// Create timezone-aware dates
const today = createManilaDate(getTodayISO()); // Today in Manila timezone
const specificDate = createManilaDate('2025-01-15'); // Specific date in Manila timezone

// Convert Date to ISO string
const isoString = toLocalISODate(new Date()); // "2025-01-15"
```

### Date Validation

```typescript
import { validateDate, validateDateRange, isBusinessDay } from '@/lib/utils';

// Validate single date
const validation = validateDate('2025-01-15');
if (validation.isValid) {
  console.log('Valid date:', validation.normalizedDate);
} else {
  console.error('Invalid date:', validation.error);
}

// Validate date range
const rangeValidation = validateDateRange('2025-01-01', '2025-01-15');
if (rangeValidation.isValid) {
  console.log('Valid range:', rangeValidation.normalizedRange);
}

// Check business day
const isWorkDay = isBusinessDay('2025-01-15'); // true if Mon-Fri
```

## Display Components

### DateDisplay Component

For displaying dates with consistent formatting:

```typescript
import { DateDisplay, ShortDate, LongDate, RelativeDate } from '@/components/shared/DateDisplay';

// Basic usage
<DateDisplay date="2025-01-15" />

// With different formats
<DateDisplay date="2025-01-15" format="short" /> // "Jan 15, 2025"
<DateDisplay date="2025-01-15" format="long" showTime={true} /> // "Jan 15, 2025 2:30 PM"
<DateDisplay date="2025-01-15" format="relative" maxRelativeDays={7} /> // "Today" or "2 days ago"

// Convenience components
<ShortDate date="2025-01-15" />
<LongDate date="2025-01-15" />
<RelativeDate date="2025-01-15" maxRelativeDays={3} />
```

### DateRangeDisplay Component

For displaying date ranges with smart formatting:

```typescript
import { DateRangeDisplay, ShortDateRange, StyledDateRange } from '@/components/shared/DateRangeDisplay';

// Basic usage
<DateRangeDisplay 
  startDate="2025-01-01" 
  endDate="2025-01-15" 
/>

// With custom separator
<DateRangeDisplay 
  startDate="2025-01-01" 
  endDate="2025-01-15" 
  separator=" to "
/>

// Styled range with custom classes
<StyledDateRange
  startDate="2025-01-01"
  endDate="2025-01-15"
  startClassName="font-bold"
  endClassName="font-bold"
  separatorClassName="text-muted-foreground"
/>
```

### RelativeTime Component

For auto-updating relative time displays:

```typescript
import { RelativeTime, FastRelativeTime, StaticRelativeTime } from '@/components/shared/RelativeTime';

// Auto-updating relative time (updates every minute)
<RelativeTime date="2025-01-15T14:30:00Z" />

// Fast updating (every 30 seconds)
<FastRelativeTime date="2025-01-15T14:30:00Z" />

// Static (no auto-updates, good for lists)
<StaticRelativeTime date="2025-01-15T14:30:00Z" />

// Custom update interval
<RelativeTime 
  date="2025-01-15T14:30:00Z"
  updateInterval={5000} // 5 seconds
  maxDays={3}
  fallbackFormat="MMM dd, yyyy"
/>
```

## Input Components

### DatePicker Component

For single date selection:

```typescript
import { DatePicker, PastDatePicker, FutureDatePicker } from '@/components/shared/DatePicker';

// Basic date picker
const [selectedDate, setSelectedDate] = useState<Date>();

<DatePicker
  value={selectedDate}
  onChange={setSelectedDate}
  placeholder="Select a date"
/>

// Past dates only (no future dates)
<PastDatePicker
  value={selectedDate}
  onChange={setSelectedDate}
  placeholder="Select past date"
/>

// With validation
<DatePicker
  value={selectedDate}
  onChange={setSelectedDate}
  minDate={new Date('2025-01-01')}
  maxDate={new Date()}
  error={!!errorMessage}
  errorMessage={errorMessage}
/>
```

### DateRangePicker Component

For date range selection:

```typescript
import { DateRangePicker, MonthlyDateRangePicker } from '@/components/shared/DateRangePicker';

const [startDate, setStartDate] = useState<Date>();
const [endDate, setEndDate] = useState<Date>();

// Basic date range picker
<DateRangePicker
  startDate={startDate}
  endDate={endDate}
  onStartDateChange={setStartDate}
  onEndDateChange={setEndDate}
/>

// With maximum range limit
<DateRangePicker
  startDate={startDate}
  endDate={endDate}
  onStartDateChange={setStartDate}
  onEndDateChange={setEndDate}
  maxRange={30} // 30 days maximum
  placeholder="Select date range"
/>

// Monthly range picker (30-day limit)
<MonthlyDateRangePicker
  startDate={startDate}
  endDate={endDate}
  onStartDateChange={setStartDate}
  onEndDateChange={setEndDate}
/>
```

## State Management Hooks

### useDateSelection Hook

For managing single date selection state:

```typescript
import { useDateSelection, usePastDateSelection } from '@/lib/hooks/date';

// Basic date selection
const {
  selectedDate,
  selectedDateISO,
  isValid,
  error,
  selectDate,
  reset,
  clear
} = useDateSelection({
  defaultDate: new Date(),
  minDate: new Date('2025-01-01'),
  maxDate: new Date(),
  validate: (date) => {
    // Custom validation
    if (date && date.getDay() === 0) {
      return 'Sundays are not allowed';
    }
    return null;
  }
});

// Past dates only
const pastDateSelection = usePastDateSelection({
  defaultDate: new Date()
});
```

### useDateRange Hook

For managing date range selection state:

```typescript
import { useDateRange, useLastSevenDaysRange } from '@/lib/hooks/date';

// Basic date range
const {
  startDate,
  endDate,
  startDateISO,
  endDateISO,
  formattedRange,
  isValid,
  error,
  hasCompleteRange,
  rangeDays,
  selectStartDate,
  selectEndDate,
  selectRange,
  setPresetRange,
  reset
} = useDateRange({
  maxRange: 30,
  autoAdjustEnd: true
});

// Set preset ranges
setPresetRange('LAST_7_DAYS');
setPresetRange('LAST_30_DAYS');

// Last 7 days with defaults
const sevenDaysRange = useLastSevenDaysRange();
```

## Migration Guide

### Replacing Manual Date Formatting

**Before:**
```typescript
// ❌ Inconsistent formatting
new Date(sale.date).toLocaleDateString()
dateRange.from.toLocaleDateString() + ' - ' + dateRange.to.toLocaleDateString()
```

**After:**
```typescript
// ✅ Standardized formatting
formatDate(sale.date)
<DateRangeDisplay startDate={dateRange.from} endDate={dateRange.to} />
```

### Replacing Custom Date Pickers

**Before:**
```typescript
// ❌ Custom implementation
<Popover>
  <PopoverTrigger asChild>
    <Button>{selectedDate ? formatDate(selectedDate) : 'Pick a date'}</Button>
  </PopoverTrigger>
  <PopoverContent>
    <Calendar
      selected={selectedDate}
      onSelect={setSelectedDate}
      disabled={(date) => date > new Date()}
    />
  </PopoverContent>
</Popover>
```

**After:**
```typescript
// ✅ Standardized component
<PastDatePicker
  value={selectedDate}
  onChange={setSelectedDate}
  placeholder="Pick a date"
/>
```

### Replacing Manual Date State Management

**Before:**
```typescript
// ❌ Manual state management
const [startDate, setStartDate] = useState<Date>();
const [endDate, setEndDate] = useState<Date>();
const [error, setError] = useState<string>();

const handleStartDateChange = (date: Date) => {
  if (endDate && date > endDate) {
    setError('Start date cannot be after end date');
    return;
  }
  setStartDate(date);
  setError(undefined);
};
```

**After:**
```typescript
// ✅ Hook-based state management
const {
  startDate,
  endDate,
  error,
  selectStartDate,
  selectEndDate
} = useDateRange({
  maxRange: 30,
  autoAdjustEnd: true
});
```

## Best Practices

### 1. Always Use Standardized Utilities

```typescript
// ✅ Good
import { formatDate } from '@/lib/utils';
const displayDate = formatDate(isoDateString);

// ❌ Avoid
const displayDate = new Date(isoDateString).toLocaleDateString();
```

### 2. Use Appropriate Components for Context

```typescript
// ✅ For display only
<DateDisplay date={sale.date} format="short" />

// ✅ For user input
<DatePicker value={selectedDate} onChange={setSelectedDate} />

// ✅ For auto-updating times
<RelativeTime date={message.createdAt} />
```

### 3. Leverage Convenience Components

```typescript
// ✅ Use specific components when possible
<PastDatePicker /> // Instead of DatePicker with maxDate
<ShortDate /> // Instead of DateDisplay with format="short"
<StaticRelativeTime /> // For lists to avoid performance issues
```

### 4. Handle Errors Gracefully

```typescript
// ✅ Always handle validation errors
const dateSelection = useDateSelection({
  validate: (date) => {
    if (!date) return 'Date is required';
    if (date > new Date()) return 'Future dates not allowed';
    return null;
  }
});

if (dateSelection.error) {
  // Show error to user
  console.error(dateSelection.error);
}
```

### 5. Use Hooks for Complex State Management

```typescript
// ✅ For complex date logic, use hooks
const dateRange = useDateRange({
  maxRange: 90,
  autoAdjustEnd: true,
  validate: (start, end) => {
    if (start && end && isWeekend(start) && isWeekend(end)) {
      return 'Range cannot span only weekends';
    }
    return null;
  }
});
```

## Troubleshooting

### Common Issues

#### 1. Timezone Inconsistencies

**Problem**: Dates showing different values across components.

**Solution**: Always use the standardized utilities:
```typescript
// ✅ Correct
const today = createManilaDate(getTodayISO());

// ❌ Incorrect
const today = new Date(); // Uses browser timezone
```

#### 2. Date Picker Not Working

**Problem**: Date picker not responding to selection.

**Solution**: Ensure proper onChange handling:
```typescript
// ✅ Correct
<DatePicker
  value={selectedDate}
  onChange={(date) => date && setSelectedDate(date)}
/>

// ❌ Incorrect - missing null check
<DatePicker
  value={selectedDate}
  onChange={setSelectedDate} // May receive undefined
/>
```

#### 3. Validation Errors Not Showing

**Problem**: Custom validation not displaying errors.

**Solution**: Use the error state from hooks:
```typescript
const { selectedDate, error, selectDate } = useDateSelection({
  validate: (date) => {
    // Your validation logic
    return date ? null : 'Date is required';
  }
});

// Display error
{error && <p className="text-destructive">{error}</p>}
```

#### 4. Performance Issues with RelativeTime

**Problem**: Too many auto-updating components causing performance issues.

**Solution**: Use StaticRelativeTime for lists:
```typescript
// ✅ For lists
{messages.map(message => (
  <StaticRelativeTime key={message.id} date={message.createdAt} />
))}

// ✅ For single important timestamps
<RelativeTime date={lastActivity} updateInterval={60000} />
```

### Debugging Tips

1. **Check Console**: Date utilities log warnings for invalid inputs
2. **Validate ISO Strings**: Ensure dates are in proper ISO format
3. **Test Timezone**: Verify dates display correctly in Asia/Manila timezone
4. **Check Boundaries**: Ensure min/max dates are properly set
5. **Validate Props**: Ensure all required props are provided to components

## Examples

### Complete Date Selection Form

```typescript
import { useDateSelection } from '@/lib/hooks/date';
import { DatePicker } from '@/components/shared/DatePicker';
import { DateDisplay } from '@/components/shared/DateDisplay';

function DateSelectionForm() {
  const {
    selectedDate,
    selectedDateISO,
    isValid,
    error,
    selectDate,
    reset
  } = useDateSelection({
    defaultDate: new Date(),
    maxDate: new Date(),
    validate: (date) => {
      if (!date) return 'Please select a date';
      if (date.getDay() === 0) return 'Sundays not allowed';
      return null;
    }
  });

  return (
    <div className="space-y-4">
      <DatePicker
        value={selectedDate}
        onChange={selectDate}
        error={!isValid}
        errorMessage={error}
        placeholder="Select a date"
      />
      
      {selectedDate && (
        <div>
          <p>Selected: <DateDisplay date={selectedDateISO!} /></p>
          <button onClick={reset}>Reset</button>
        </div>
      )}
    </div>
  );
}
```

### Date Range Analysis Component

```typescript
import { useDateRange } from '@/lib/hooks/date';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { DateRangeDisplay } from '@/components/shared/DateRangeDisplay';

function DateRangeAnalysis() {
  const {
    startDate,
    endDate,
    formattedRange,
    rangeDays,
    isValid,
    error,
    selectStartDate,
    selectEndDate,
    setPresetRange
  } = useDateRange({
    maxRange: 90,
    autoAdjustEnd: true
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setPresetRange('LAST_7_DAYS')}>
          Last 7 Days
        </button>
        <button onClick={() => setPresetRange('LAST_30_DAYS')}>
          Last 30 Days
        </button>
      </div>
      
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={selectStartDate}
        onEndDateChange={selectEndDate}
        maxRange={90}
        error={!isValid}
        errorMessage={error}
      />
      
      {formattedRange && (
        <div>
          <p>Range: {formattedRange}</p>
          <p>Days: {rangeDays}</p>
        </div>
      )}
    </div>
  );
}
```

This guide covers all aspects of the date handling system. For additional help, refer to the TypeScript interfaces in the source code or check the component documentation in Storybook (if available).