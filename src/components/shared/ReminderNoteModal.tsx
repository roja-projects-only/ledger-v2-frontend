/**
 * Reminder Note Modal - Add reminder notes for customers
 *
 * Features:
 * - Add reminder note for a customer
 * - Display reminder history
 * - Show last reminder date
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { remindersApi } from "@/lib/api/reminders.api";
import { queryKeys } from "@/lib/queryKeys";
import { notify } from "@/lib/notifications";
import { handleApiError } from "@/lib/api/client";
import { Bell, Calendar, User as UserIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ============================================================================
// Types
// ============================================================================

interface ReminderNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
  customerName: string;
}

// ============================================================================
// Reminder Note Modal Component
// ============================================================================

export function ReminderNoteModal({
  open,
  onOpenChange,
  customerId,
  customerName,
}: ReminderNoteModalProps) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");

  // Fetch reminder history
  const { data: reminderHistory, isLoading: historyLoading } = useQuery({
    queryKey: queryKeys.reminders.customerHistory(customerId || ""),
    queryFn: () =>
      customerId ? remindersApi.getCustomerReminders(customerId) : null,
    enabled: !!customerId && open,
  });

  // Add reminder note mutation
  const addReminderMutation = useMutation({
    mutationFn: (data: { customerId: string; note: string }) =>
      remindersApi.create(data),
    onSuccess: () => {
      notify.success("Reminder note added successfully");
      setNote("");
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.reminders.customerHistory(customerId || ""),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.reminders.needingReminders(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.payments.outstanding(),
      });
      onOpenChange(false);
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      notify.error(apiError.message || "Failed to add reminder note");
    },
  });

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSubmit = () => {
    if (!customerId || !note.trim()) return;

    addReminderMutation.mutate({
      customerId,
      note: note.trim(),
    });
  };

  const handleClose = () => {
    setNote("");
    onOpenChange(false);
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] sm:max-h-[95vh] flex flex-col p-0 gap-0 overflow-hidden mx-0 sm:mx-auto rounded-b-none sm:rounded-lg">
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Bell className="h-5 w-5" />
            <span className="truncate">Add Reminder Note for {customerName}</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Add a reminder note for this customer
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* Add Reminder Form */}
            <div className="space-y-2">
              <Label htmlFor="reminder-note" className="font-semibold text-sm">
                Reminder Note
              </Label>
              <Textarea
                id="reminder-note"
                placeholder="e.g., Called customer about payment, will pay next week..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                maxLength={500}
                disabled={addReminderMutation.isPending}
                className="resize-none text-sm"
              />
              <div className="text-xs sm:text-xs text-muted-foreground text-right">
                {note.length}/500 characters
              </div>
            </div>

            {/* Reminder History */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Reminder History</h3>
              {historyLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full" />
                  ))}
                </div>
              ) : !reminderHistory || reminderHistory.reminders.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No reminder notes yet</p>
                </div>
              ) : (
                <div className="max-h-48 sm:max-h-64 overflow-y-auto scroll-smooth will-change-transform" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div className="space-y-2">
                    {reminderHistory.reminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className="border rounded-lg p-3 space-y-2 hover:bg-muted/30 will-change-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs sm:text-sm flex-1">{reminder.note}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(reminder.reminderDate), {
                              addSuffix: true,
                            })}
                          </span>
                          {reminder.createdBy && (
                            <span className="flex items-center gap-1">
                              <UserIcon className="h-3 w-3" />
                              {reminder.createdBy.username}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 border-t p-3 sm:p-4 gap-2 sm:gap-3 flex">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={addReminderMutation.isPending}
            className="flex-1 h-11 sm:h-12"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!note.trim() || addReminderMutation.isPending}
            className="flex-1 h-11 sm:h-12"
          >
            {addReminderMutation.isPending ? "Adding..." : "Add Reminder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
