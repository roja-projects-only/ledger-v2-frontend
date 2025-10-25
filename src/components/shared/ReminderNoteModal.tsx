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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Add Reminder Note
          </DialogTitle>
          <DialogDescription>
            Add a reminder note for {customerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Reminder Form */}
          <div className="space-y-2">
            <Label htmlFor="reminder-note">Reminder Note</Label>
            <Textarea
              id="reminder-note"
              placeholder="e.g., Called customer about payment, will pay next week..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              maxLength={500}
              disabled={addReminderMutation.isPending}
            />
            <div className="text-xs text-muted-foreground text-right">
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
              <div className="max-h-64 overflow-y-auto scroll-smooth will-change-transform" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="space-y-2 p-0">
                  {reminderHistory.reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="border rounded-lg p-3 space-y-2 hover:bg-muted/30 will-change-colors m-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm flex-1">{reminder.note}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
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

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={addReminderMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!note.trim() || addReminderMutation.isPending}
          >
            {addReminderMutation.isPending ? "Adding..." : "Add Reminder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
