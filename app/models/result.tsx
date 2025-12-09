"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  CopyIcon,
  CheckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SlidersHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { PinotQueryResponse } from "@/app/utils/pinot";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  columnIndex: number;
  direction: SortDirection;
}

export interface TableDisplaySettings {
  sortConfig: SortConfig | null;
  visibleColumns: Set<number>;
}

export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * Converts a PinotQueryResponse into a shadcn Table component
 * @param response The Pinot query response containing resultTable with dataSchema and rows
 * @returns JSX element containing the Table component
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatLatency(timeUsedMs: number): string {
  if (timeUsedMs < 1000) {
    return `${Math.round(timeUsedMs)} ms`;
  }
  return `${(timeUsedMs / 1000).toFixed(2)} s`;
}

function getStatusColor(sizeBytes: number, latencyMs: number): string {
  const oneMB = 1024 * 1024; // 1MB in bytes
  const thirtyTwoMB = 32 * 1024 * 1024; // 32MB in bytes
  const oneSecond = 1000; // 1s in ms
  const tenSeconds = 10000; // 10s in ms

  if (sizeBytes < oneMB && latencyMs < oneSecond) {
    return "text-green-600 dark:text-green-400";
  } else if (sizeBytes < thirtyTwoMB && latencyMs < tenSeconds) {
    return "text-yellow-600 dark:text-yellow-400";
  } else {
    return "text-red-600 dark:text-red-400";
  }
}

function compareValues(a: unknown, b: unknown): number {
  // Handle nulls - nulls go to the end
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;

  // Try numeric comparison first
  const numA = Number(a);
  const numB = Number(b);
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB;
  }

  // Fall back to string comparison
  return String(a).localeCompare(String(b));
}

export function PinotResultTable({
  response,
  sortConfig,
  visibleColumns,
  currentPage,
  pageSize,
  onSortChange,
  onVisibleColumnsChange,
  onPageChange,
  onPageSizeChange,
}: {
  response: PinotQueryResponse;
  sortConfig?: SortConfig | null;
  visibleColumns?: Set<number>;
  currentPage?: number;
  pageSize?: number;
  onSortChange?: (config: SortConfig | null) => void;
  onVisibleColumnsChange?: (columns: Set<number>) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}) {
  const { resultTable } = response;
  const { columnNames } = resultTable.dataSchema;
  const { rows } = resultTable;
  const [copied, setCopied] = useState(false);
  const [csvCopied, setCsvCopied] = useState(false);

  // Use provided state or fall back to internal defaults
  const effectiveVisibleColumns = visibleColumns ?? new Set(columnNames.map((_, i) => i));
  const effectiveSortConfig = sortConfig ?? null;
  const effectivePageSize = pageSize ?? DEFAULT_PAGE_SIZE;
  const effectiveCurrentPage = currentPage ?? 0;

  const responseSizeBytes = new Blob([JSON.stringify(response)]).size;
  const responseSize = formatFileSize(responseSizeBytes);
  const latency = formatLatency(response.timeUsedMs);
  const statusColor = getStatusColor(responseSizeBytes, response.timeUsedMs);

  // Get visible column indices in order
  const visibleColumnIndices = useMemo(() => {
    return columnNames
      .map((_, index) => index)
      .filter((index) => effectiveVisibleColumns.has(index));
  }, [columnNames, effectiveVisibleColumns]);

  // Sort rows based on sortConfig
  const sortedRows = useMemo(() => {
    if (!effectiveSortConfig) return rows;

    const { columnIndex, direction } = effectiveSortConfig;
    return [...rows].sort((a, b) => {
      const comparison = compareValues(a[columnIndex], b[columnIndex]);
      return direction === "asc" ? comparison : -comparison;
    });
  }, [rows, effectiveSortConfig]);

  // Pagination calculations
  const totalRows = sortedRows.length;
  const totalPages = Math.ceil(totalRows / effectivePageSize);
  const startIndex = effectiveCurrentPage * effectivePageSize;
  const endIndex = Math.min(startIndex + effectivePageSize, totalRows);

  // Get paginated rows
  const paginatedRows = useMemo(() => {
    return sortedRows.slice(startIndex, endIndex);
  }, [sortedRows, startIndex, endIndex]);

  const handleHeaderClick = (columnIndex: number) => {
    if (!onSortChange) return;

    if (effectiveSortConfig?.columnIndex === columnIndex) {
      // Toggle direction or clear
      if (effectiveSortConfig.direction === "asc") {
        onSortChange({ columnIndex, direction: "desc" });
      } else {
        onSortChange(null); // Clear sort on third click
      }
    } else {
      // New column - start with ascending
      onSortChange({ columnIndex, direction: "asc" });
    }
  };

  const handleColumnVisibilityChange = (columnIndex: number, checked: boolean) => {
    if (!onVisibleColumnsChange) return;

    const newVisible = new Set(effectiveVisibleColumns);
    if (checked) {
      newVisible.add(columnIndex);
    } else {
      // Don't allow hiding all columns
      if (newVisible.size > 1) {
        newVisible.delete(columnIndex);
      }
    }
    onVisibleColumnsChange(newVisible);
  };

  const handleShowAllColumns = () => {
    if (!onVisibleColumnsChange) return;
    onVisibleColumnsChange(new Set(columnNames.map((_, i) => i)));
  };

  const handlePageSizeChange = (newSize: string) => {
    const size = parseInt(newSize, 10);
    if (onPageSizeChange) {
      onPageSizeChange(size);
    }
    // Reset to first page when page size changes
    if (onPageChange) {
      onPageChange(0);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const convertToCSV = (): string => {
    // Escape CSV value (handle commas, quotes, newlines)
    const escapeCSV = (value: unknown): string => {
      if (value === null || value === undefined) {
        return "";
      }
      const stringValue = String(value);
      // If contains comma, quote, or newline, wrap in quotes and escape quotes
      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Only export visible columns
    const visibleNames = visibleColumnIndices.map((i) => columnNames[i]);
    const headerRow = visibleNames.map(escapeCSV).join(",");

    // Create data rows with only visible columns (export all sorted rows, not just current page)
    const dataRows = sortedRows.map((row) =>
      visibleColumnIndices.map((i) => escapeCSV(row[i])).join(",")
    );

    // Combine header and data rows
    return [headerRow, ...dataRows].join("\n");
  };

  const handleCopyCsv = async () => {
    try {
      const csvContent = convertToCSV();
      await navigator.clipboard.writeText(csvContent);
      setCsvCopied(true);
      setTimeout(() => setCsvCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy CSV:", err);
    }
  };

  const hiddenCount = columnNames.length - effectiveVisibleColumns.size;

  return (
    <div className="mt-4">
      <Tabs defaultValue="table" className="w-full">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TabsList>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontalIcon className="size-4" />
                  Columns
                  {hiddenCount > 0 && (
                    <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
                      {hiddenCount} hidden
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Toggle Columns</span>
                  {hiddenCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 text-xs"
                      onClick={handleShowAllColumns}
                    >
                      Show all
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columnNames.map((name, index) => (
                  <DropdownMenuCheckboxItem
                    key={index}
                    checked={effectiveVisibleColumns.has(index)}
                    onCheckedChange={(checked) =>
                      handleColumnVisibilityChange(index, checked)
                    }
                    onSelect={(e) => e.preventDefault()}
                  >
                    <span className="truncate">{name}</span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm">
              <span className={statusColor}>Size: {responseSize}</span>
              <span className={statusColor}>Latency: {latency}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <>
                  <CheckIcon className="size-4" />
                  Copied!
                </>
              ) : (
                <>
                  <CopyIcon className="size-4" />
                  JSON
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCsv}
              className="gap-2"
            >
              {csvCopied ? (
                <>
                  <CheckIcon className="size-4" />
                  Copied!
                </>
              ) : (
                <>
                  <CopyIcon className="size-4" />
                  CSV
                </>
              )}
            </Button>
          </div>
        </div>
        <TabsContent value="table" className="mt-2">
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0">
                  <TableRow>
                    {visibleColumnIndices.map((columnIndex) => {
                      const isSorted = effectiveSortConfig?.columnIndex === columnIndex;
                      const sortDirection = isSorted
                        ? effectiveSortConfig.direction
                        : null;

                      return (
                        <TableHead
                          key={columnIndex}
                          className="text-base font-semibold cursor-pointer select-none hover:bg-muted/80 transition-colors"
                          onClick={() => handleHeaderClick(columnIndex)}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{columnNames[columnIndex]}</span>
                            <span className="w-4 flex items-center justify-center">
                              {sortDirection === "asc" && (
                                <ArrowUpIcon className="size-3.5 text-foreground" />
                              )}
                              {sortDirection === "desc" && (
                                <ArrowDownIcon className="size-3.5 text-foreground" />
                              )}
                              {!sortDirection && (
                                <span className="text-muted-foreground/40 text-xs">⇅</span>
                              )}
                            </span>
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRows.length > 0 ? (
                    paginatedRows.map((row, rowIndex) => (
                      <TableRow key={startIndex + rowIndex}>
                        {visibleColumnIndices.map((columnIndex) => (
                          <TableCell key={columnIndex}>
                            {row[columnIndex] !== null && row[columnIndex] !== undefined
                              ? String(row[columnIndex])
                              : ""}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={visibleColumnIndices.length}
                        className="text-center text-muted-foreground"
                      >
                        No results found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination Controls */}
            {totalRows > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Rows per page:</span>
                  <Select
                    value={String(effectivePageSize)}
                    onValueChange={handlePageSizeChange}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {startIndex + 1}-{endIndex} of {totalRows} rows
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onPageChange?.(0)}
                      disabled={effectiveCurrentPage === 0}
                    >
                      <ChevronsLeftIcon className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onPageChange?.(effectiveCurrentPage - 1)}
                      disabled={effectiveCurrentPage === 0}
                    >
                      <ChevronLeftIcon className="size-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                      Page {effectiveCurrentPage + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onPageChange?.(effectiveCurrentPage + 1)}
                      disabled={effectiveCurrentPage >= totalPages - 1}
                    >
                      <ChevronRightIcon className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onPageChange?.(totalPages - 1)}
                      disabled={effectiveCurrentPage >= totalPages - 1}
                    >
                      <ChevronsRightIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="json" className="mt-2">
          <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto bg-slate-50 dark:bg-slate-900">
            <pre className="p-4 text-sm overflow-x-auto">
              <code>{JSON.stringify(response, null, 2)}</code>
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
