import type { CollectionStatus, Location, Payment } from "@/lib/types";

export interface AgingReportCustomer {
  customerId: string;
  customerName: string;
  location: Location;
  current: number;
  days31to60: number;
  days61to90: number;
  over90Days: number;
  totalOwed: number;
  collectionStatus: CollectionStatus;
  lastPaymentDate?: string;
}

export interface AgingReportData {
  summary: {
    totalCustomers: number;
    totalOutstanding: number;
    current: number;
    days31to60: number;
    days61to90: number;
    over90Days: number;
  };
  customers: AgingReportCustomer[];
  generatedAt: string;
}

export interface DailyPaymentsReportData {
  summary: {
    date: string;
    totalPayments: number;
    totalAmount: number;
    paymentMethods: Record<string, number>;
  };
  payments: Payment[];
  generatedAt: string;
}
