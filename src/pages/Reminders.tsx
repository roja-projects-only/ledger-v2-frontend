/**
 * Reminders Dashboard Page - Manage customer payment reminders
 *
 * Features:
 * - List customers needing reminders (configurable days)
 * - Quick reminder note entry
 * - Bulk reminder notes
 * - Mark customers as reminded
 * - Filter by days since last reminder
 */

import { useState, useMemo } from "react";
import { Container } from "@/components/layout/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationBadge } from "@/components/shared/LocationBadge";
import { ReminderNoteModal } from "@/components/shared/ReminderNoteModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { remindersApi } from "@/lib/api/reminders.api";
import { queryKeys } from "@/lib/queryKeys";
import { notify } from "@/lib/notifications";
import { handleApiError } from "@/lib/api/client";
import { formatCurrency, cn } from "@/lib/utils";
import { getSemanticColor } from "@/lib/colors";
import {
  Bell,
  Users,
  Clock,
  AlertTriangle,
  Search,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ============================================================================
// Types
// ============================================================================

type DaysFilter = 7 | 14 | 30 | 60;

// ============================================================================
// Reminders Dashboard Page Component
// ============================================================================

export function Reminders() {
  const queryClient = useQueryClient();

  // Filter state
  const [daysFilter, setDaysFilter] = useState<DaysFilter>(7);
  const [searchQuery, setSearchQuery] = useState("");

  // Bulk reminder state
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(
    new Set()
  );
  const [bulkNote, setBulkNote] = useState("");
  const [showBulkForm, setShowBulkForm] = useState(false);

  // Single reminder modal state
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  const [selectedCustomerName, setSelectedCustomerName] = useState("");

  // Fetch customers needing reminders
  const {
    data: customersNeedingReminders,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.reminders.needingReminders(daysFilter),
    queryFn: () => remindersApi.getCustomersNeedingReminders(daysFilter),
  });

  // Fetch reminder stats
  const { data: stats } = useQuery({
    queryKey: queryKeys.reminders.stats(),
    queryFn: remindersApi.getStats,
  });

  // Calculate dynamic "Need Reminders" count based on current filter
  const needRemindersCount = customersNeedingReminders?.length ?? 0;

  // Bulk add reminder notes mutation
  const bulkReminderMutation = useMutation({
    mutationFn: (data: { customerIds: string[]; note: string }) =>
      remindersApi.bulkCreate(data),
    onSuccess: (result) => {
      notify.success(result.message);
      setBulkNote("");
      setSelectedCustomers(new Set());
      setShowBulkForm(false);
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.reminders.needingReminders(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.reminders.stats(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.payments.outstanding(),
      });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      notify.error(apiError.message || "Failed to add reminder notes");
    },
  });

  // ============================================================================
  // Computed Values
  // ============================================================================

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    if (!customersNeedingReminders) return [];

    return customersNeedingReminders.filter((customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customersNeedingReminders, searchQuery]);

  // Get semantic colors for KPI cards
  const infoColor = getSemanticColor("info");
  const warningColor = getSemanticColor("warning");
  const errorColor = getSemanticColor("error");

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleToggleCustomer = (customerId: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCustomers.size === filteredCustomers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(
        new Set(filteredCustomers.map((c) => c.id))
      );
    }
  };

  const handleBulkReminder = () => {
    if (selectedCustomers.size === 0 || !bulkNote.trim()) return;

    bulkReminderMutation.mutate({
      customerIds: Array.from(selectedCustomers),
      note: bulkNote.trim(),
    });
  };

  const handleSingleReminder = (customerId: string, customerName: string) => {
    setSelectedCustomerId(customerId);
    setSelectedCustomerName(customerName);
    setReminderModalOpen(true);
  };

  // ============================================================================
  // Render
  // ============================================================================

  const errorTone = getSemanticColor("error");

  return (
    <div className="py-6">
      <Container>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Payment Reminders
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage customer payment reminders and follow-ups
            </p>
          </div>

          {/* Summary KPIs */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Reminders Today - Info tone (sky blue) */}
              <Card className={cn("border-2", infoColor.bg, infoColor.border)}>
                <CardHeader className="pb-0">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-md", infoColor.bg)}>
                      <Bell className={cn("h-3.5 w-3.5", infoColor.icon)} />
                    </div>
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Reminders Today
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-2xl font-bold">{stats.remindersToday}</div>
                </CardContent>
              </Card>

              {/* Reminders This Week - Warning tone (amber) */}
              <Card className={cn("border-2", warningColor.bg, warningColor.border)}>
                <CardHeader className="pb-0">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-md", warningColor.bg)}>
                      <Clock className={cn("h-3.5 w-3.5", warningColor.icon)} />
                    </div>
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Reminders This Week
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-2xl font-bold">{stats.remindersThisWeek}</div>
                </CardContent>
              </Card>

              {/* Customers with Debt - Error tone (red) */}
              <Card className={cn("border-2", errorColor.bg, errorColor.border)}>
                <CardHeader className="pb-0">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-md", errorColor.bg)}>
                      <Users className={cn("h-3.5 w-3.5", errorColor.icon)} />
                    </div>
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Customers with Debt
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-2xl font-bold">{stats.customersWithDebt}</div>
                </CardContent>
              </Card>

              {/* Need Reminders - Warning tone (amber) */}
              <Card className={cn("border-2", warningColor.bg, warningColor.border)}>
                <CardHeader className="pb-0">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-md", warningColor.bg)}>
                      <AlertTriangle className={cn("h-3.5 w-3.5", warningColor.icon)} />
                    </div>
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Need Reminders
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-2xl font-bold">{needRemindersCount}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters and Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="space-y-2">
                  <Label htmlFor="search">Search Customers</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Days Filter */}
                <div className="space-y-2">
                  <Label htmlFor="days-filter">
                    Days Since Last Reminder
                  </Label>
                  <Select
                    value={daysFilter.toString()}
                    onValueChange={(value) =>
                      setDaysFilter(parseInt(value) as DaysFilter)
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger id="days-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7+ days</SelectItem>
                      <SelectItem value="14">14+ days</SelectItem>
                      <SelectItem value="30">30+ days</SelectItem>
                      <SelectItem value="60">60+ days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bulk Actions */}
                <div className="space-y-2">
                  <Label>Bulk Actions</Label>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowBulkForm(!showBulkForm)}
                    disabled={isLoading || filteredCustomers.length === 0}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {showBulkForm ? "Hide" : "Show"} Bulk Reminder
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Reminder Form */}
          {showBulkForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Bulk Reminder Note
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-note">Reminder Note</Label>
                  <Textarea
                    id="bulk-note"
                    placeholder="e.g., Called about payment, will follow up next week..."
                    value={bulkNote}
                    onChange={(e) => setBulkNote(e.target.value)}
                    rows={3}
                    maxLength={500}
                    disabled={bulkReminderMutation.isPending}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {bulkNote.length}/500 characters
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {selectedCustomers.size} customer(s) selected
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBulkNote("");
                        setSelectedCustomers(new Set());
                        setShowBulkForm(false);
                      }}
                      disabled={bulkReminderMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleBulkReminder}
                      disabled={
                        selectedCustomers.size === 0 ||
                        !bulkNote.trim() ||
                        bulkReminderMutation.isPending
                      }
                    >
                      {bulkReminderMutation.isPending
                        ? "Adding..."
                        : `Add to ${selectedCustomers.size} Customer(s)`}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className={cn(
                "rounded-lg border px-4 py-3 text-sm",
                errorTone.bg,
                errorTone.border,
                errorTone.text
              )}
            >
              <p className="font-medium">
                Unable to load customers needing reminders.
              </p>
              <p className={cn("text-xs", errorTone.subtext)}>
                {error instanceof Error ? error.message : "Unknown error"}.
                Please check your connection and try again.
              </p>
            </div>
          )}

          {/* Customers List */}
          {isLoading ? (
            <Card>
              <CardContent className="space-y-3 py-6">
                {[...Array(5)].map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </CardContent>
            </Card>
          ) : !customersNeedingReminders ||
            customersNeedingReminders.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                  <h3 className="text-lg font-semibold">All caught up!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    No customers need reminders at this time
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : filteredCustomers.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    No customers found matching your search
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Customers Needing Reminders ({filteredCustomers.length})
                  </CardTitle>
                  {showBulkForm && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedCustomers.size === filteredCustomers.length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className={cn(
                      "border rounded-lg p-4 transition-all duration-200",
                      showBulkForm && selectedCustomers.has(customer.id)
                        ? "border-primary bg-primary/5"
                        : ""
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox for bulk selection */}
                      {showBulkForm && (
                        <Checkbox
                          checked={selectedCustomers.has(customer.id)}
                          onCheckedChange={() =>
                            handleToggleCustomer(customer.id)
                          }
                          className="mt-1"
                        />
                      )}

                      {/* Customer Info */}
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">
                              {customer.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <LocationBadge
                                location={customer.location}
                                size="sm"
                              />
                              {customer.phone && (
                                <span className="text-sm text-muted-foreground">
                                  {customer.phone}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Outstanding Amount */}
                          <div className="text-right">
                            <div className="text-lg font-bold text-red-600">
                              {formatCurrency(customer.outstandingBalance)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Outstanding
                            </div>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Days Past Due:
                            </span>
                            <span className="ml-2 font-medium">
                              {customer.daysPastDue || 0} days
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Last Reminder:
                            </span>
                            <span className="ml-2 font-medium">
                              {customer.lastReminderDate
                                ? formatDistanceToNow(
                                    new Date(customer.lastReminderDate),
                                    { addSuffix: true }
                                  )
                                : "Never"}
                            </span>
                          </div>
                        </div>

                        {/* Action Button */}
                        {!showBulkForm && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleSingleReminder(customer.id, customer.name)
                            }
                            className="w-full sm:w-auto"
                          >
                            <Bell className="h-3.5 w-3.5 mr-2" />
                            Add Reminder Note
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </Container>

      {/* Single Reminder Modal */}
      <ReminderNoteModal
        open={reminderModalOpen}
        onOpenChange={setReminderModalOpen}
        customerId={selectedCustomerId}
        customerName={selectedCustomerName}
      />
    </div>
  );
}
