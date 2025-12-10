"use client"

import { DatasourceSelector } from "@/components/datasource-selector"
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PinotResultTable, SortConfig, DEFAULT_PAGE_SIZE } from "@/app/models/result";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import { TableIcon, PieChartIcon, LineChartIcon, BarChart3Icon, AreaChartIcon } from "lucide-react";

const QUERY_STORAGE_KEY = "pakora-visualize-query";

type TimeoutUnit = "ms" | "s";

// Color palette for charts - vibrant and distinct colors
const CHART_COLORS = [
  "hsl(221, 83%, 53%)",   // Blue
  "hsl(142, 71%, 45%)",   // Green
  "hsl(47, 100%, 50%)",   // Yellow/Gold
  "hsl(0, 84%, 60%)",     // Red
  "hsl(262, 83%, 58%)",   // Purple
  "hsl(199, 89%, 48%)",   // Cyan
  "hsl(25, 95%, 53%)",    // Orange
  "hsl(330, 81%, 60%)",   // Pink
  "hsl(173, 80%, 40%)",   // Teal
  "hsl(280, 68%, 60%)",   // Violet
  "hsl(45, 93%, 47%)",    // Amber
  "hsl(210, 40%, 50%)",   // Slate Blue
];

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

// Helper to create a signature for columns to detect changes
function getColumnSignature(response: PinotQueryResponse | null): string {
  if (!response) return "";
  return response.resultTable.dataSchema.columnNames.join("|");
}

type VisualizationType = "table" | "pie" | "line" | "bar" | "area";

interface ChartSettingsProps {
  response: PinotQueryResponse;
  labelColumn: number;
  valueColumn: number;
  onLabelColumnChange: (index: number) => void;
  onValueColumnChange: (index: number) => void;
}

function ChartSettings({
  response,
  labelColumn,
  valueColumn,
  onLabelColumnChange,
  onValueColumnChange,
}: ChartSettingsProps) {
  const { columnNames, columnDataTypes } = response.resultTable.dataSchema;

  return (
    <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-2">
        <Label htmlFor="label-column" className="text-sm whitespace-nowrap">Label Column:</Label>
        <Select
          value={String(labelColumn)}
          onValueChange={(val) => onLabelColumnChange(parseInt(val))}
        >
          <SelectTrigger className="w-[180px]" id="label-column">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {columnNames.map((name, index) => (
              <SelectItem key={index} value={String(index)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="value-column" className="text-sm whitespace-nowrap">Value Column:</Label>
        <Select
          value={String(valueColumn)}
          onValueChange={(val) => onValueColumnChange(parseInt(val))}
        >
          <SelectTrigger className="w-[180px]" id="value-column">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {columnNames.map((name, index) => (
              <SelectItem key={index} value={String(index)}>
                {name} ({columnDataTypes[index]})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

interface ChartData {
  name: string;
  value: number;
  fill: string;
}

function prepareChartData(
  response: PinotQueryResponse,
  labelColumn: number,
  valueColumn: number
): ChartData[] {
  const { rows } = response.resultTable;
  
  return rows.map((row, index) => ({
    name: String(row[labelColumn] ?? `Row ${index + 1}`),
    value: Number(row[valueColumn]) || 0,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));
}

function generateChartConfig(data: ChartData[]): ChartConfig {
  const config: ChartConfig = {};
  data.forEach((item, index) => {
    config[item.name] = {
      label: item.name,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
  });
  return config;
}

interface VisualizationPanelProps {
  response: PinotQueryResponse;
  visualizationType: VisualizationType;
  onVisualizationTypeChange: (type: VisualizationType) => void;
  sortConfig: SortConfig | null;
  visibleColumns: Set<number>;
  currentPage: number;
  pageSize: number;
  onSortChange: (config: SortConfig | null) => void;
  onVisibleColumnsChange: (columns: Set<number>) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function VisualizationPanel({
  response,
  visualizationType,
  onVisualizationTypeChange,
  sortConfig,
  visibleColumns,
  currentPage,
  pageSize,
  onSortChange,
  onVisibleColumnsChange,
  onPageChange,
  onPageSizeChange,
}: VisualizationPanelProps) {
  const { columnNames, columnDataTypes } = response.resultTable.dataSchema;
  
  // Find best default columns for charts
  const [labelColumn, setLabelColumn] = useState(() => {
    // Prefer string columns for labels
    const stringIdx = columnDataTypes.findIndex(t => 
      t.toLowerCase().includes('string') || t.toLowerCase().includes('varchar')
    );
    return stringIdx >= 0 ? stringIdx : 0;
  });
  
  const [valueColumn, setValueColumn] = useState(() => {
    // Prefer numeric columns for values
    const numericIdx = columnDataTypes.findIndex(t => 
      t.toLowerCase().includes('int') || 
      t.toLowerCase().includes('long') || 
      t.toLowerCase().includes('float') || 
      t.toLowerCase().includes('double') ||
      t.toLowerCase().includes('big_decimal')
    );
    return numericIdx >= 0 ? numericIdx : (columnNames.length > 1 ? 1 : 0);
  });

  const chartData = useMemo(() => 
    prepareChartData(response, labelColumn, valueColumn),
    [response, labelColumn, valueColumn]
  );
  
  const chartConfig = useMemo(() => 
    generateChartConfig(chartData),
    [chartData]
  );

  const valueColumnName = columnNames[valueColumn];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Tabs value={visualizationType} onValueChange={(v) => onVisualizationTypeChange(v as VisualizationType)}>
          <TabsList>
            <TabsTrigger value="table" className="gap-2">
              <TableIcon className="h-4 w-4" />
              Table
            </TabsTrigger>
            <TabsTrigger value="pie" className="gap-2">
              <PieChartIcon className="h-4 w-4" />
              Pie Chart
            </TabsTrigger>
            <TabsTrigger value="bar" className="gap-2">
              <BarChart3Icon className="h-4 w-4" />
              Bar Chart
            </TabsTrigger>
            <TabsTrigger value="line" className="gap-2">
              <LineChartIcon className="h-4 w-4" />
              Line Chart
            </TabsTrigger>
            <TabsTrigger value="area" className="gap-2">
              <AreaChartIcon className="h-4 w-4" />
              Area Chart
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {visualizationType !== "table" && (
        <ChartSettings
          response={response}
          labelColumn={labelColumn}
          valueColumn={valueColumn}
          onLabelColumnChange={setLabelColumn}
          onValueColumnChange={setValueColumn}
        />
      )}

      {visualizationType === "table" && (
        <PinotResultTable
          response={response}
          sortConfig={sortConfig}
          visibleColumns={visibleColumns}
          currentPage={currentPage}
          pageSize={pageSize}
          onSortChange={onSortChange}
          onVisibleColumnsChange={onVisibleColumnsChange}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}

      {visualizationType === "pie" && (
        <Card>
          <CardContent className="pt-6">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[400px]">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  innerRadius={60}
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend
                  content={<ChartLegendContent nameKey="name" />}
                  className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {visualizationType === "bar" && (
        <Card>
          <CardContent className="pt-6">
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                  name={valueColumnName}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {visualizationType === "line" && (
        <Card>
          <CardContent className="pt-6">
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS[0], strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                  name={valueColumnName}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {visualizationType === "area" && (
        <Card>
          <CardContent className="pt-6">
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2}
                  fill="url(#colorValue)"
                  name={valueColumnName}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Visualize() {
  // Always start with empty string to match server render
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PinotQueryResponse | null>(null);
  const [error, setError] = useState<PinotQueryError | null>(null);
  const [loading, setLoading] = useState(false);
  const isInitialMount = useRef(true);
  const [timeoutValue, setTimeoutValue] = useState("");
  const [timeoutUnit, setTimeoutUnit] = useState<TimeoutUnit>("ms");

  // Visualization type
  const [visualizationType, setVisualizationType] = useState<VisualizationType>("table");

  // Table display settings that persist across query runs
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<number>>(new Set());
  const [lastColumnSignature, setLastColumnSignature] = useState<string>("");

  // Pagination settings
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

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

  // Reset table settings when columns change
  const handleNewResults = useCallback((response: PinotQueryResponse) => {
    const newSignature = getColumnSignature(response);
    const numColumns = response.resultTable.dataSchema.columnNames.length;

    if (newSignature !== lastColumnSignature) {
      // Columns changed - reset to defaults
      setSortConfig(null);
      setVisibleColumns(new Set(Array.from({ length: numColumns }, (_, i) => i)));
      setCurrentPage(0); // Reset to first page
      setLastColumnSignature(newSignature);
    }

    setResults(response);
  }, [lastColumnSignature]);

  const handleRunQuery = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

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
        handleNewResults(response);
      } else {
        setResults(null);
      }
    } catch (error) {
      console.error("Error executing query:", error);
      const errorMessage =
        error instanceof Error
          ? new PinotQueryError(`Failed to execute query: ${error.message}`)
          : new PinotQueryError("Failed to execute query: Unknown error");
      setError(errorMessage);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [query, timeoutUnit, timeoutValue, handleNewResults]);

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
              <div className="flex flex-col gap-3 pr-3 h-full" id="visualize-query-editor">
                <div className="flex-1 min-h-0">
                  <MyQueryEditor language="sql" value={query} onChange={setQuery} className="h-full" uniqueDivName="visualize-query-editor" />
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
          <div className="p-2 h-full overflow-auto">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Query Error</AlertTitle>
                <AlertDescription>
                  {error.message || "An error occurred while executing the query."}
                </AlertDescription>
              </Alert>
            )}
            {results && (
              <VisualizationPanel
                response={results}
                visualizationType={visualizationType}
                onVisualizationTypeChange={setVisualizationType}
                sortConfig={sortConfig}
                visibleColumns={visibleColumns}
                currentPage={currentPage}
                pageSize={pageSize}
                onSortChange={setSortConfig}
                onVisibleColumnsChange={setVisibleColumns}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            )}
            {!results && !error && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Run a query to see results and visualizations</p>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
