/**

 * Settings Page - Configure application settings

 * 

 * Features:

 * - Business settings (business name)

 * - Pricing settings (unit price)

 * - User management (add/edit/delete users, max 3)

 * - Reset to defaults functionality

 */



import { useState, useEffect } from "react";

import { Container } from "@/components/layout/Container";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Skeleton } from "@/components/ui/skeleton";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import {

  Dialog,

  DialogContent,

  DialogDescription,

  DialogFooter,

  DialogHeader,

  DialogTitle,

} from "@/components/ui/dialog";

import {

  AlertDialog,

  AlertDialogAction,

  AlertDialogCancel,

  AlertDialogContent,

  AlertDialogDescription,

  AlertDialogFooter,

  AlertDialogHeader,

  AlertDialogTitle,

} from "@/components/ui/alert-dialog";

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from "@/components/ui/select";

import { useSettings } from "@/lib/contexts/SettingsContext";
import { useUsers } from "@/lib/hooks/useUsers";
import { useCustomers } from "@/lib/hooks/useCustomers";
import type { User } from "@/lib/api/users.api";
import { MAX_USERS, PASSCODE_LENGTH, DEFAULT_SETTINGS } from "@/lib/constants";
import { getSemanticColor } from "@/lib/colors";
import { notify } from "@/lib/notifications";
import { cn, formatCurrency, parseCurrency, isValidPasscode } from "@/lib/utils";

import { Plus, Pencil, Trash2, Save, RotateCcw, Loader2 } from "lucide-react";



// ============================================================================

// Settings Page Component

// ============================================================================



export function Settings() {

  const {
    settings,
    updateSettings,
    resetToDefaults,
    loading: settingsLoading,
    error: settingsError,
  } = useSettings();

  const {
    users,
    loading: usersLoading,
    error: usersError,
    addUser,
    updateUser,
    deleteUser,
  } = useUsers();

  const {
    customers,
  } = useCustomers();



  // Form state for business settings

  const [businessName, setBusinessName] = useState(settings.businessName || "");

  const [unitPrice, setUnitPrice] = useState(formatCurrency(settings.unitPrice));
  const [enableCustomPricing, setEnableCustomPricing] = useState(settings.enableCustomPricing);



  // User management state

  const [userDialogOpen, setUserDialogOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [userToDelete, setUserToDelete] = useState<User | null>(null);



  // User form state

  const [userUsername, setUserUsername] = useState("");

  const [userPasscode, setUserPasscode] = useState("");

  const [userRole, setUserRole] = useState<"ADMIN" | "STAFF">("STAFF");

  const [userActive, setUserActive] = useState(true);

  const loading = settingsLoading || usersLoading;
  const apiError = settingsError || usersError;
  const errorTone = getSemanticColor("error");
  const warningTone = getSemanticColor("warning");

  // Check if settings have unsaved changes
  const hasUnsavedChanges = 
    businessName !== (settings.businessName || "") ||
    unitPrice !== formatCurrency(settings.unitPrice) ||
    enableCustomPricing !== settings.enableCustomPricing;

  // Update form when settings load

  useEffect(() => {

    setBusinessName(settings.businessName || "");

    setUnitPrice(formatCurrency(settings.unitPrice));
    setEnableCustomPricing(settings.enableCustomPricing);

  }, [settings]);



  // ============================================================================

  // Business Settings Handlers

  // ============================================================================

  const handleSaveSettings = async () => {

    if (apiError) {
      notify.error("Cannot save settings. Server connection error.");
      return;
    }

    const parsedPrice = parseCurrency(unitPrice);



    if (parsedPrice <= 0) {

      notify.error("Unit price must be greater than 0");

      return;

    }

    // Save all settings together
    const success = await updateSettings({

      businessName: businessName.trim() || undefined,

      unitPrice: parsedPrice,
      enableCustomPricing: enableCustomPricing,
    });

    if (success) {
      notify.success("Settings saved successfully");
    } else {
      notify.error("Failed to save settings");
    }
  };



  const handleResetSettings = () => {

    resetToDefaults();

    setResetDialogOpen(false);

    notify.success("Settings reset to defaults");

  };

  const handleToggleCustomPricing = (checked: boolean) => {
    // Only update local state, don't save immediately
    setEnableCustomPricing(checked);
    // User must click "Save Settings" to persist the change
  };

  // Calculate customers with custom prices
  const customersWithPricing = customers?.filter(c => c.customUnitPrice != null) || [];
  const customersWithPricingCount = customersWithPricing.length;
  const hasCustomersWithPricing = customersWithPricingCount > 0;



  // ============================================================================

  // User Management Handlers

  // ============================================================================



  const handleAddUser = () => {

    if (apiError) {
      notify.error("Cannot modify users. Server connection error.");
      return;
    }

    if (users.length >= MAX_USERS) {

      notify.error(`Maximum ${MAX_USERS} users allowed`);

      return;

    }



    setEditingUser(null);

    setUserUsername("");

    setUserPasscode("");

    setUserRole("STAFF");

    setUserActive(true);

    setUserDialogOpen(true);

  };



  const handleEditUser = (user: User) => {

    setEditingUser(user);

    setUserUsername(user.username);

    setUserPasscode(""); // Leave blank, only update if provided

    setUserRole(user.role);

    setUserActive(user.active);

    setUserDialogOpen(true);

  };



  const handleDeleteUser = (user: User) => {

    setUserToDelete(user);

    setDeleteDialogOpen(true);

  };



  const handleSaveUser = async () => {

    if (apiError) {
      notify.error("Cannot save users. Server connection error.");
      return;
    }

    // Validation

    if (!userUsername.trim()) {

      notify.error("Username is required");

      return;

    }



    // Check for duplicate username (case-insensitive, excluding current user when editing)

    const duplicateUsername = users.find(

      (u) =>

        u.username.toLowerCase() === userUsername.toLowerCase() &&

        u.id !== editingUser?.id

    );



    if (duplicateUsername) {

      notify.error("Username already exists");

      return;

    }



    // Passcode validation (required for new users, optional for editing)

    if (!editingUser && !isValidPasscode(userPasscode)) {

      notify.error(`Passcode must be exactly ${PASSCODE_LENGTH} digits`);

      return;

    }



    if (editingUser && userPasscode && !isValidPasscode(userPasscode)) {

      notify.error(`Passcode must be exactly ${PASSCODE_LENGTH} digits`);

      return;

    }



    try {

      if (editingUser) {

        // Update existing user

        const updateData: { username?: string; role?: "ADMIN" | "STAFF"; active?: boolean; password?: string } = {};

        

        // Only update username if changed

        if (userUsername.trim() !== editingUser.username) {

          updateData.username = userUsername.trim();

        }

        

        // Only update role if changed

        if (userRole !== editingUser.role) {

          updateData.role = userRole;

        }

        

        // Only update active status if changed

        if (userActive !== editingUser.active) {

          updateData.active = userActive;

        }

        

        // Include password if provided (admin can reset user password)

        if (userPasscode) {

          updateData.password = userPasscode;

        }



        // Update user info (includes password if provided)

        if (Object.keys(updateData).length > 0) {

          await updateUser(editingUser.id, updateData);

        }

      } else {

        // Create new user

        await addUser({

          username: userUsername.trim(),

          passcode: userPasscode,

          role: userRole,

        });

      }



      setUserDialogOpen(false);

      setUserUsername("");

      setUserPasscode("");

      setUserRole("STAFF");

      setEditingUser(null);

    } catch (error) {

      // Errors handled by useUsers hook with toast

      console.error(error);

    }

  };



  const confirmDeleteUser = async () => {

    if (!userToDelete) return;



    await deleteUser(userToDelete.id);

    setDeleteDialogOpen(false);

    setUserToDelete(null);

  };



  // ============================================================================

  // Render

  // ============================================================================






  return (

    <div className="py-6">

      <Container>

        <div className="space-y-6">

          {/* Page Header */}

          <div>

            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

            <p className="text-muted-foreground mt-1">

              Manage your business settings and user accounts

            </p>

          </div>

        {apiError && (
          <div
            role="alert"
            aria-live="polite"
            className={cn(
              "rounded-lg border px-4 py-3 text-sm",
              errorTone.bg,
              errorTone.border,
              errorTone.text,
            )}
          >
            <p className="font-medium">Unable to load data from server.</p>
            <p className={cn("text-xs", errorTone.subtext)}>
              {apiError}. Please check your connection and try again.
            </p>
          </div>
        )}



          {/* Business Settings Card */}

          <Card>

            <CardHeader>

              <CardTitle>Business Settings</CardTitle>

              <CardDescription>Configure your business information</CardDescription>

            </CardHeader>

            <CardContent className="space-y-3">

              {loading ? (

                <div className="space-y-3">

                  <Skeleton className="h-9 w-full" />

                  <Skeleton className="h-4 w-32" />

                </div>

              ) : (

                <div className="space-y-2">

                  <Label htmlFor="businessName">Business Name (Optional)</Label>

                  <Input

                    id="businessName"

                    placeholder="Enter business name"

                    value={businessName}

                    onChange={(e) => setBusinessName(e.target.value)}

                    disabled={!!apiError}

                    className="w-full"

                  />

                </div>

              )}

            </CardContent>

          </Card>



          {/* Pricing Settings Card */}

          <Card>

            <CardHeader>

              <CardTitle>Pricing Settings</CardTitle>

              <CardDescription>Configure default pricing</CardDescription>

            </CardHeader>

            <CardContent className="space-y-6">

              {loading ? (

                <div className="space-y-3">

                  <Skeleton className="h-9 w-full" />

                  <Skeleton className="h-4 w-48" />

                  <Skeleton className="h-4 w-36" />

                </div>

              ) : (

                <>
                  {/* Unit Price Field */}
                  <div className="space-y-2">

                    <Label htmlFor="unitPrice">Unit Price per Container</Label>

                    <Input

                      id="unitPrice"

                      placeholder={DEFAULT_SETTINGS.unitPrice.toFixed(2)}

                      value={unitPrice}

                      onChange={(e) => setUnitPrice(e.target.value)}

                      disabled={!!apiError}

                      inputMode="decimal"

                      className="w-full"

                    />

                    <p className="text-sm text-muted-foreground">

                      This is the default price used for all customers without custom pricing.

                    </p>

                  </div>

                  {/* Divider */}
                  <Separator />

                  {/* Custom Pricing Toggle */}
                  <div className="flex items-start justify-between gap-4 p-4 border rounded-lg">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Label htmlFor="enableCustomPricing" className="cursor-pointer">
                          Enable Custom Pricing
                        </Label>
                        {hasCustomersWithPricing && (
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            {customersWithPricingCount} {customersWithPricingCount === 1 ? 'customer' : 'customers'} affected
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Allow setting custom prices per customer that override the global price.
                      </p>
                      {enableCustomPricing && hasCustomersWithPricing && (
                        <p className="text-sm text-amber-600 dark:text-amber-500 mt-2">
                          ⚠️ Disabling will use global price for all customers until re-enabled.
                        </p>
                      )}
                    </div>
                    <Switch
                      id="enableCustomPricing"
                      checked={enableCustomPricing}
                      onCheckedChange={handleToggleCustomPricing}
                      disabled={!!apiError}
                      className="shrink-0 mt-1"
                    />
                  </div>
                </>

              )}



              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                {hasUnsavedChanges && !loading && (
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
                    warningTone.bg,
                    warningTone.border,
                    warningTone.text
                  )}>
                    <span className="font-medium">Unsaved changes</span>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button

                    onClick={handleSaveSettings}

                    disabled={loading || !!apiError || !hasUnsavedChanges}

                  >

                    {loading ? (

                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                    ) : (

                      <Save className="mr-2 h-4 w-4" />

                    )}

                    Save Settings

                  </Button>

                  <Button

                    variant="outline"

                  onClick={() => setResetDialogOpen(true)}

                  disabled={loading || !!apiError}

                >

                  <RotateCcw className="mr-2 h-4 w-4" />

                  Reset to Defaults

                </Button>
                </div>

              </div>

            </CardContent>

          </Card>



          {/* User Management Card */}

          <Card>

            <CardHeader>

              <div className="flex items-center justify-between">

                <div>

                  <CardTitle>User Management</CardTitle>

                  <CardDescription>

                    Manage user accounts (maximum {MAX_USERS} users)

                  </CardDescription>

                </div>

                <Button
                  onClick={handleAddUser}
                  disabled={loading || !!apiError || (users !== null && users.length >= MAX_USERS)}
                  size="sm"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Add User
                </Button>

              </div>

            </CardHeader>

            <CardContent className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : !users || users.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No users yet. Add your first user to get started.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">@{user.username}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            user.role === "ADMIN" ? "bg-sky-500/20 text-sky-400" : "bg-slate-700 text-slate-300"
                          )}>
                            {user.role}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            user.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                          )}>
                            {user.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditUser(user)}
                          disabled={!!apiError}
                          aria-label={`Edit ${user.username}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(user)}
                          disabled={!!apiError}
                          aria-label={`Delete ${user.username}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

          </Card>

        </div>

      </Container>



      {/* User Add/Edit Dialog */}

      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>

        <DialogContent>

          <DialogHeader>

            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>

            <DialogDescription>

              {editingUser

                ? "Update user details. Leave passcode empty to keep current."

                : "Create a new user account with a 6-digit passcode."}

            </DialogDescription>

          </DialogHeader>

          <div className="space-y-3 py-4">

            <div className="space-y-2">

              <Label htmlFor="userUsername">Username</Label>

              <Input

                id="userUsername"

                placeholder="username"

                value={userUsername}

                onChange={(e) => setUserUsername(e.target.value)}

                className="w-full"

              />

            </div>

            <div className="space-y-2">

              <Label htmlFor="userPasscode">

                Passcode ({PASSCODE_LENGTH} digits)

                {editingUser && " (leave empty to keep current)"}

              </Label>

              <Input

                id="userPasscode"

                type="password"

                placeholder="000000"

                maxLength={PASSCODE_LENGTH}

                value={userPasscode}

                onChange={(e) => setUserPasscode(e.target.value.replace(/\D/g, ""))}

                className="w-full"

              />

            </div>

            <div className="space-y-2">

              <Label htmlFor="userRole">Role</Label>

              <Select value={userRole} onValueChange={(value) => setUserRole(value as "ADMIN" | "STAFF")}>

                <SelectTrigger className="w-full">

                  <SelectValue placeholder="Select role" />

                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="STAFF">Staff</SelectItem>

                  <SelectItem value="ADMIN">Admin</SelectItem>

                </SelectContent>

              </Select>

            </div>

            <div className="flex items-center justify-between py-2 px-3 border rounded-lg">

              <div className="space-y-0.5">

                <Label htmlFor="userActive" className="cursor-pointer">Account Status</Label>

                <p className="text-sm text-muted-foreground">

                  {userActive ? "Active - User can log in" : "Inactive - User cannot log in"}

                </p>

              </div>

              <Switch

                id="userActive"

                checked={userActive}

                onCheckedChange={setUserActive}

              />

            </div>

          </div>

          <DialogFooter>

            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>

              Cancel

            </Button>

            <Button onClick={handleSaveUser} disabled={!!apiError}>

              {editingUser ? "Update" : "Create"} User

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>



      {/* Delete User Confirmation */}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>

        <AlertDialogContent>

          <AlertDialogHeader>

            <AlertDialogTitle>Delete User</AlertDialogTitle>

            <AlertDialogDescription>

              Are you sure you want to delete <strong>@{userToDelete?.username}</strong>? This action

              cannot be undone.

            </AlertDialogDescription>

          </AlertDialogHeader>

          <AlertDialogFooter>

            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction onClick={confirmDeleteUser}>Delete</AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>

      </AlertDialog>



      {/* Reset Settings Confirmation */}

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>

        <AlertDialogContent>

          <AlertDialogHeader>

            <AlertDialogTitle>Reset Settings</AlertDialogTitle>

            <AlertDialogDescription>

              Are you sure you want to reset all settings to defaults? Your business name will be

              cleared and unit price will be reset to {formatCurrency(DEFAULT_SETTINGS.unitPrice)}.

            </AlertDialogDescription>

          </AlertDialogHeader>

          <AlertDialogFooter>

            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction onClick={handleResetSettings}>Reset</AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>

      </AlertDialog>

    </div>

  );

}

