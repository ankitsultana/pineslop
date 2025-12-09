"use client"

import { DatasourceSelector } from "@/components/datasource-selector"
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PinotResultTable } from "@/app/models/result";
import { executePinotQuery, PinotQueryError } from "@/app/utils/pinot";
import type { PinotQueryResponse } from "@/app/utils/pinot";
import MyQueryEditor from "../utils/editor";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Checkbox } from "@/components/ui/checkbox"


const QUERY_STORAGE_KEY = "pakora-query";

type TimeoutUnit = "ms" | "s";

interface QueryOptionsPanelProps {
  timeoutValue: string;
  timeoutUnit: TimeoutUnit;
  onTimeoutValueChange: (value: string) => void;
  onTimeoutUnitChange: (unit: TimeoutUnit) => void;
}

function QueryOptionsPanel({
  timeoutValue,
  timeoutUnit,
  onTimeoutValueChange,
  onTimeoutUnitChange,
}: QueryOptionsPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Query Options</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="query-timeout">Timeout</Label>
            <div className="flex items-center gap-2">
              <Input
                id="query-timeout"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="e.g. 30"
                value={timeoutValue}
                onChange={(event) => onTimeoutValueChange(event.target.value)}
                aria-label="Query timeout"
                className="max-w-[140px]"
              />
              <Select
                value={timeoutUnit}
                onValueChange={(value) => onTimeoutUnitChange(value as TimeoutUnit)}
              >
                <SelectTrigger className="min-w-[110px]">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ms">Milliseconds</SelectItem>
                  <SelectItem value="s">Seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms" className="cursor-pointer">Use Multistage Engine</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


export default function MyQuery() {
  // Always start with empty string to match server render
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PinotQueryResponse | null>(null);
  const [error, setError] = useState<PinotQueryError | null>(null);
  const [loading, setLoading] = useState(false);
  const isInitialMount = useRef(true);
  const [timeoutValue, setTimeoutValue] = useState("");
  const [timeoutUnit, setTimeoutUnit] = useState<TimeoutUnit>("ms");

  // Load query from localStorage after mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedQuery = localStorage.getItem(QUERY_STORAGE_KEY);
      if (savedQuery) {
        setQuery(savedQuery);
      }
      isInitialMount.current = false;
    }
  }, []);

  // Save query to localStorage whenever it changes (but not on initial mount)
  useEffect(() => {
    if (typeof window !== "undefined" && !isInitialMount.current) {
      localStorage.setItem(QUERY_STORAGE_KEY, query);
    }
  }, [query]);

  const handleRunQuery = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    let timeoutMs: number | undefined;
    if (timeoutValue.trim().length > 0) {
      const parsed = Number(timeoutValue);
      if (!Number.isNaN(parsed) && parsed > 0) {
        timeoutMs = timeoutUnit === "s" ? parsed * 1000 : parsed;
      }
    }

    try {
      const { response, error: queryError } = await executePinotQuery(
        query,
        timeoutMs,
      );

      if (queryError) {
        setError(queryError);
      }

      if (response) {
        setResults(response);
      }
    } catch (error) {
      console.error("Error executing query:", error);
      const errorMessage =
        error instanceof Error
          ? new PinotQueryError(`Failed to execute query: ${error.message}`)
          : new PinotQueryError("Failed to execute query: Unknown error");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [query, timeoutUnit, timeoutValue]);

  // Add keyboard shortcut for Cmd+Enter (or Ctrl+Enter) to run query
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Enter" &&
        (event.metaKey || event.ctrlKey) &&
        !loading &&
        query.trim()
      ) {
        event.preventDefault();
        handleRunQuery();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [query, loading, handleRunQuery]);

  return (
    <div className="flex flex-col gap-4 w-full h-full p-4">
      <DatasourceSelector />
      <ResizablePanelGroup
        direction="vertical"
        className="min-h-[400px]"
      >
        <ResizablePanel>
          <ResizablePanelGroup
          direction="horizontal"
          className="min-h-[200px]"
          >
            <ResizablePanel defaultSize={65} minSize={40} className="p-2">
              <div className="flex flex-col gap-3 pr-3 h-full" id="sql-query-editor">
                <div className="flex-1 min-h-0">
                  <MyQueryEditor language="sql" value={query} onChange={setQuery} className="h-full" uniqueDivName="sql-query-editor" />
                </div>
                <Button
                  variant={"outline"}
                  className="max-w-[100px] h-[50px] max-h-[150px] shrink-0"
                  onClick={handleRunQuery}
                  disabled={loading || !query.trim()}
                >
                  Run
                  <KbdGroup>
                    <Kbd>⌘</Kbd>
                    <Kbd>⏎</Kbd>
                  </KbdGroup>
                </Button>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={35} minSize={20} className="p-2">
              <QueryOptionsPanel
                timeoutValue={timeoutValue}
                timeoutUnit={timeoutUnit}
                onTimeoutValueChange={setTimeoutValue}
                onTimeoutUnitChange={setTimeoutUnit}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel>
          {error && (
          <Alert variant="destructive">
            <AlertTitle>Query Error</AlertTitle>
            <AlertDescription>
              {error.message || "An error occurred while executing the query."}
            </AlertDescription>
          </Alert>)}
          {results && <PinotResultTable response={results} />}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}