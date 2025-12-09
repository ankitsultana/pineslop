"use client";

import { useState } from "react";
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
import { CopyIcon, CheckIcon } from "lucide-react";
import { PinotQueryResponse } from "@/app/utils/pinot";

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

export function PinotResultTable({
  response,
}: {
  response: PinotQueryResponse;
}) {
  const { resultTable } = response;
  const { columnNames, columnDataTypes } = resultTable.dataSchema;
  const { rows } = resultTable;
  const [copied, setCopied] = useState(false);
  const [csvCopied, setCsvCopied] = useState(false);

  const responseSizeBytes = new Blob([JSON.stringify(response)]).size;
  const responseSize = formatFileSize(responseSizeBytes);
  const latency = formatLatency(response.timeUsedMs);
  const statusColor = getStatusColor(responseSizeBytes, response.timeUsedMs);

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
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) {
        return "";
      }
      const stringValue = String(value);
      // If contains comma, quote, or newline, wrap in quotes and escape quotes
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Create header row
    const headerRow = columnNames.map(escapeCSV).join(",");
    
    // Create data rows
    const dataRows = rows.map(row => 
      row.map(escapeCSV).join(",")
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

  return (
    <div className="mt-4">
      <Tabs defaultValue="table" className="w-full">
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
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
          <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  {columnNames.map((column, index) => (
                    <TableHead key={index} className="text-base font-semibold">{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length > 0 ? (
                  rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>
                          {cell !== null && cell !== undefined ? String(cell) : ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columnNames.length}
                      className="text-center text-muted-foreground"
                    >
                      No results found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
