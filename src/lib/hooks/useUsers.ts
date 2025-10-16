/**
 * useUsers - Custom hook for managing users
 * 
 * Backend API integration for user management (admin only).
 * Maximum 3 users enforced by backend.
 */

import { useCallback, useEffect, useState } from "react";
import { usersApi, handleApiError } from "@/lib/api";
import type { User } from "@/lib/api/users.api";
import { toast } from "sonner";

// ============================================================================
// Hook
// ============================================================================

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all users on mount
   */
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const usersList = await usersApi.list();
      setUsers(usersList);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      console.error("Failed to fetch users:", apiError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /**
   * Get user by ID
   */
  const getUser = useCallback(async (id: string): Promise<User | null> => {
    try {
      return await usersApi.get(id);
    } catch (err) {
      const apiError = handleApiError(err);
      console.error("Failed to get user:", apiError);
      return null;
    }
  }, []);

  /**
   * Create new user (max 3 users)
   */
  const addUser = useCallback(
    async (data: {
      username: string;
      passcode: string;
      role?: "ADMIN" | "STAFF";
    }): Promise<User | null> => {
      try {
        const newUser = await usersApi.create(data);
        setUsers((prev) => [...prev, newUser]);
        toast.success("User created successfully");
        return newUser;
      } catch (err) {
        const apiError = handleApiError(err);
        toast.error(`Failed to create user: ${apiError.message}`);
        console.error("Failed to create user:", apiError);
        return null;
      }
    },
    []
  );

  /**
   * Update user
   */
  const updateUser = useCallback(
    async (
      id: string,
      data: {
        username?: string;
        role?: "ADMIN" | "STAFF";
        active?: boolean;
      }
    ): Promise<User | null> => {
      try {
        const updatedUser = await usersApi.update(id, data);
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? updatedUser : u))
        );
        toast.success("User updated successfully");
        return updatedUser;
      } catch (err) {
        const apiError = handleApiError(err);
        toast.error(`Failed to update user: ${apiError.message}`);
        console.error("Failed to update user:", apiError);
        return null;
      }
    },
    []
  );

  /**
   * Delete user (cannot delete self)
   */
  const deleteUser = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await usersApi.delete(id);
        setUsers((prev) => prev.filter((u) => u.id !== id));
        toast.success("User deleted successfully");
        return true;
      } catch (err) {
        const apiError = handleApiError(err);
        toast.error(`Failed to delete user: ${apiError.message}`);
        console.error("Failed to delete user:", apiError);
        return false;
      }
    },
    []
  );

  /**
   * Change user password
   */
  const changeUserPassword = useCallback(
    async (id: string, newPassword: string): Promise<boolean> => {
      try {
        await usersApi.changePassword(id, { newPassword });
        toast.success("Password changed successfully");
        return true;
      } catch (err) {
        const apiError = handleApiError(err);
        toast.error(`Failed to change password: ${apiError.message}`);
        console.error("Failed to change password:", apiError);
        return false;
      }
    },
    []
  );

  /**
   * Get user statistics
   */
  const getUserStats = useCallback(async () => {
    try {
      return await usersApi.stats();
    } catch (err) {
      const apiError = handleApiError(err);
      console.error("Failed to get user stats:", apiError);
      return null;
    }
  }, []);

  return {
    // Data
    users,
    
    // Methods
    addUser,
    updateUser,
    deleteUser,
    getUser,
    changeUserPassword,
    getUserStats,
    refreshUsers: fetchUsers,
    
    // States
    loading,
    error,
  };
}
