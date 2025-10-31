/**
 * Settings API
 * 
 * Handles application settings (key-value store).
 */

import { apiClient } from "./client";
import {
  adaptSimpleListResponse,
  adaptItemResponse,
  adaptMutationResponse,
  asEnvelope,
} from "./adapters";
import type {
  ItemApiEnvelope,
  MutationApiEnvelope,
  SimpleListApiEnvelope,
} from "./adapters";

// ============================================================================
// Types
// ============================================================================

// Using exported SettingValue below

export interface Setting {
  id: string;
  key: string;
  value: string; // Raw string value
  type: "string" | "number" | "boolean" | "json";
  parsedValue?: SettingValue; // Backend-parsed value with correct type
  updatedAt: string;
  updatedBy?: {
    id: string;
    username: string;
  };
}

export type SettingValue = string | number | boolean | Record<string, unknown> | unknown[] | null;

export interface CreateSettingRequest {
  key: string;
  value: string;
  type: "string" | "number" | "boolean" | "json";
}

export interface UpdateSettingRequest {
  value: string;
  type?: "string" | "number" | "boolean" | "json";
}

export interface UpsertSettingRequest {
  key: string;
  value: string;
  type: "string" | "number" | "boolean" | "json";
}

export interface BulkUpdateRequest {
  settings: Array<{
    key: string;
    value: string;
    type: "string" | "number" | "boolean" | "json";
  }>;
}

// ============================================================================
// Settings API
// ============================================================================

export const settingsApi = {
  /**
   * List all settings
   */
  list: async (): Promise<Setting[]> => {
    const response = await apiClient.get<SimpleListApiEnvelope<Setting>>("/settings");
    return adaptSimpleListResponse<Setting>(
      asEnvelope<SimpleListApiEnvelope<Setting>>(response)
    ).data;
  },

  /**
   * Get setting by key
   */
  get: async (key: string): Promise<Setting> => {
    const response = await apiClient.get<ItemApiEnvelope<Setting>>(`/settings/${key}`);
    return adaptItemResponse<Setting>(asEnvelope<ItemApiEnvelope<Setting>>(response)).data;
  },

  /**
   * Create new setting (admin only)
   */
  create: async (data: CreateSettingRequest): Promise<Setting> => {
    const response = await apiClient.post<ItemApiEnvelope<Setting>>("/settings", data);
    return adaptItemResponse<Setting>(asEnvelope<ItemApiEnvelope<Setting>>(response)).data;
  },

  /**
   * Update setting (admin only)
   * Note: Backend PATCH /settings/:key only updates existing settings
   */
  update: async (key: string, data: UpdateSettingRequest): Promise<Setting> => {
    const response = await apiClient.patch<ItemApiEnvelope<Setting>>(`/settings/${key}`, data);
    return adaptItemResponse<Setting>(asEnvelope<ItemApiEnvelope<Setting>>(response)).data;
  },

  /**
   * Create or update setting (upsert, admin only)
   * Note: Backend PUT /settings/:key creates if not exists, updates if exists
   */
  upsert: async (data: UpsertSettingRequest): Promise<Setting> => {
    const { key, ...body } = data;
    const response = await apiClient.put<ItemApiEnvelope<Setting>>(`/settings/${key}`, body);
    return adaptItemResponse<Setting>(asEnvelope<ItemApiEnvelope<Setting>>(response)).data;
  },

  /**
   * Delete setting (admin only)
   */
  delete: async (key: string): Promise<void> => {
    const response = await apiClient.delete<MutationApiEnvelope<null>>(`/settings/${key}`);
    adaptMutationResponse<null>(asEnvelope<MutationApiEnvelope<null>>(response));
  },

  /**
   * Bulk update settings (admin only)
   */
  bulkUpdate: async (data: BulkUpdateRequest): Promise<Setting[]> => {
    const response = await apiClient.post<SimpleListApiEnvelope<Setting>>(
      "/settings/bulk",
      data
    );
    return adaptSimpleListResponse<Setting>(
      asEnvelope<SimpleListApiEnvelope<Setting>>(response)
    ).data;
  },

  /**
   * Get settings count
   */
  count: async (): Promise<number> => {
    const response = await apiClient.get<ItemApiEnvelope<number>>("/settings/count");
    return adaptItemResponse<number>(asEnvelope<ItemApiEnvelope<number>>(response)).data;
  },

  /**
   * Helper: Get settings as key-value object
   * Uses parsedValue from backend for type-safe values
   */
  getAsObject: async (): Promise<Record<string, SettingValue>> => {
    const settings = await settingsApi.list();
    const obj: Record<string, SettingValue> = {};
    
    settings.forEach((setting) => {
      // Backend provides parsedValue with correct type (string/number/boolean/object)
      // Falls back to raw value if parsedValue is not available
      obj[setting.key] = setting.parsedValue !== undefined ? setting.parsedValue : setting.value;
    });
    
    return obj;
  },
};
