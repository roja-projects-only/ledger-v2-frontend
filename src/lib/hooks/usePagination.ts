/**
 * usePagination - Page-based pagination hook
 * 
 * Features:
 * - Classic page-based pagination (1, 2, 3...)
 * - Page navigation (next, prev, go to page)
 * - Configurable items per page
 * - Total pages calculation
 * - Reset when data changes
 * 
 * @param items - Full array of items to paginate
 * @param itemsPerPage - Number of items per page (default: 10)
 * @returns Current page data and navigation functions
 */

import { useState, useEffect, useMemo } from "react";

interface UsePaginationOptions {
  itemsPerPage?: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  pageItems: T[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  startIndex: number;
  endIndex: number;
  totalItems: number;
}

export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
  const { itemsPerPage = 10 } = options;
  
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // Reset to page 1 if items change significantly or current page exceeds total
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Calculate page items
  const pageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  // Navigation functions
  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  // Calculate indices for display
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, items.length);

  return {
    currentPage,
    totalPages,
    pageItems,
    goToPage,
    nextPage,
    prevPage,
    canGoNext: currentPage < totalPages,
    canGoPrev: currentPage > 1,
    startIndex,
    endIndex,
    totalItems: items.length,
  };
}
