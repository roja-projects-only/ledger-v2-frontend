/**
 * React Query Key Factory
 * 
 * Centralized query key management for consistent caching.
 * Keys are hierarchical: ['entity', 'operation', ...filters]
 * 
 * Benefits:
 * - Type-safe query keys
 * - Easy invalidation (invalidate all sales, specific customer, etc.)
 * - Consistent structure across the app
 */

export const queryKeys = {
  // Sales query keys
  sales: {
    all: ['sales'] as const,
    lists: () => [...queryKeys.sales.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.sales.lists(), filters] as const,
    details: () => [...queryKeys.sales.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.sales.details(), id] as const,
  },
  
  // Customers query keys
  customers: {
    all: ['customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.customers.lists(), filters] as const,
    details: () => [...queryKeys.customers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
  },
  
  // Users query keys
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
  },
  
  // Payments query keys
  payments: {
    all: ['payments'] as const,
    lists: () => [...queryKeys.payments.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.payments.lists(), filters] as const,
    details: () => [...queryKeys.payments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.payments.details(), id] as const,
    outstanding: () => [...queryKeys.payments.all, 'outstanding'] as const,
    customerPayments: (customerId: string) => [...queryKeys.payments.all, 'customer', customerId] as const,
    customerOutstanding: (customerId: string) => [...queryKeys.payments.all, 'customer', customerId, 'outstanding'] as const,
    agingReport: () => [...queryKeys.payments.all, 'aging'] as const,
    dailyReport: (date: string) => [...queryKeys.payments.all, 'daily', date] as const,
  },
  
  // Reminder notes query keys
  reminders: {
    all: ['reminders'] as const,
    lists: () => [...queryKeys.reminders.all, 'list'] as const,
    customerReminders: (customerId: string) => [...queryKeys.reminders.all, 'customer', customerId] as const,
    overdue: (daysSinceLastReminder?: number) => [...queryKeys.reminders.all, 'overdue', daysSinceLastReminder] as const,
  },
} as const;
