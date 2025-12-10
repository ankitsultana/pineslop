"use client"

import { DatasourceSelector } from "@/components/datasource-selector"
import { useState, useEffect, useRef, useCallback, useMemo, Fragment } from "react";
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
import {
  executePinotQuery,
  executeTimeSeriesRangeQueryWithLanguage,
  fetchTimeSeriesLanguages,
  PinotQueryError,
} from "@/app/utils/pinot";
import type {
  PinotQueryResponse,
  TimeSeriesMetric,
  TimeSeriesQueryResponse,
} from "@/app/utils/pinot";
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
const LANGUAGE_STORAGE_KEY = "pakora-visualize-language";

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

const DEFAULT_TIMESERIES_WINDOW_SECONDS = 60 * 60; // last 60 minutes
const DEFAULT_TIMESERIES_STEP = "1m";

type TimeRangeKey =
  | "5m"
  | "1h"
  | "1d"
  | "2d"
  | "7d"
  | "1mo"
  | "1y";

const TIME_RANGE_OPTIONS: Array<{ key: TimeRangeKey; label: string; seconds: number }> = [
  { key: "5m", label: "Last 5 Minutes", seconds: 5 * 60 },
  { key: "1h", label: "Last 1 Hour", seconds: 60 * 60 },
  { key: "1d", label: "Last 1 Day", seconds: 24 * 60 * 60 },
  { key: "2d", label: "Last 2 Days", seconds: 2 * 24 * 60 * 60 },
  { key: "7d", label: "Last 7 Days", seconds: 7 * 24 * 60 * 60 },
  { key: "1mo", label: "Last 1 Month", seconds: 30 * 24 * 60 * 60 },
  { key: "1y", label: "Last 1 Year", seconds: 365 * 24 * 60 * 60 },
];

interface QueryOptionsPanelProps {
  timeoutValue: string;
  timeoutUnit: TimeoutUnit;
  onTimeoutValueChange: (value: string) => void;
  onTimeoutUnitChange: (unit: TimeoutUnit) => void;
  selectedRangeKey: TimeRangeKey;
  onRangeChange: (key: TimeRangeKey) => void;
}

function QueryOptionsPanel({
  timeoutValue,
  timeoutUnit,
  onTimeoutValueChange,
  onTimeoutUnitChange,
  selectedRangeKey,
  onRangeChange,
}: QueryOptionsPanelProps) {
  return (
    <Card className="w-fit h-fit">
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
          <div className="space-y-2">
            <Label htmlFor="time-range">Time Range</Label>
            <Select
              value={selectedRangeKey}
              onValueChange={(value) => onRangeChange(value as TimeRangeKey)}
            >
              <SelectTrigger id="time-range" className="min-w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

interface TimeSeriesPoint {
  ts: number;
  tsLabel: string;
  [metricName: string]: number | string;
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

function formatTimestamp(tsMs: number): string {
  const date = new Date(tsMs);
  return date.toLocaleString();
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
  const isTimeSeries = useMemo(() => {
    if (columnNames.length !== 3) return false;
    const lowered = columnNames.map((name) => name.toLowerCase());
    return lowered[0] === "metric" && lowered[1] === "timestamp" && lowered[2] === "value";
  }, [columnNames]);
  
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

  const timeSeriesData = useMemo(() => {
    if (!isTimeSeries) return null;
    const rows = response.resultTable.rows;
    const metrics = new Set<string>();
    const map = new Map<number, TimeSeriesPoint>();

    rows.forEach((row) => {
      const metric = String(row[0] ?? "metric");
      const tsSeconds = Number(row[1]);
      const valueRaw = row[2];
      const value = Number(valueRaw);
      metrics.add(metric);

      if (!Number.isFinite(tsSeconds)) return;
      const tsMs = tsSeconds * 1000;
      const entry = map.get(tsMs) ?? { ts: tsMs, tsLabel: formatTimestamp(tsMs) };
      entry[metric] = Number.isFinite(value) ? value : valueRaw;
      map.set(tsMs, entry);
    });

    const data = Array.from(map.values()).sort((a, b) => a.ts - b.ts);
    return { data, metrics: Array.from(metrics) };
  }, [isTimeSeries, response.resultTable.rows]);
  
  const chartConfig = useMemo(() => {
    if (timeSeriesData) {
      const config: ChartConfig = {};
      timeSeriesData.metrics.forEach((metric, index) => {
        config[metric] = {
          label: metric,
          color: CHART_COLORS[index % CHART_COLORS.length],
        };
      });
      return config;
    }
    return generateChartConfig(chartData);
  }, [chartData, timeSeriesData]);

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
              {timeSeriesData ? (
                <LineChart data={timeSeriesData.data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="ts"
                    type="number"
                    domain={["auto", "auto"]}
                    tickFormatter={(value) => formatTimestamp(Number(value))}
                    tickLine={false}
                    axisLine={false}
                    height={70}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => formatTimestamp(Number(value))}
                      />
                    }
                  />
                  {timeSeriesData.metrics.map((metric) => {
                    const color = chartConfig[metric]?.color ?? CHART_COLORS[0];
                    return (
                      <Line
                        key={metric}
                        type="monotone"
                        dataKey={metric}
                        stroke={color}
                        strokeWidth={2}
                        dot={{ fill: color, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                        name={metric}
                        connectNulls
                      />
                    );
                  })}
                </LineChart>
              ) : (
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
              )}
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {visualizationType === "area" && (
        <Card>
          <CardContent className="pt-6">
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              {timeSeriesData ? (
                <AreaChart data={timeSeriesData.data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="ts"
                    type="number"
                    domain={["auto", "auto"]}
                    tickFormatter={(value) => formatTimestamp(Number(value))}
                    tickLine={false}
                    axisLine={false}
                    height={70}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => formatTimestamp(Number(value))}
                      />
                    }
                  />
                  {timeSeriesData.metrics.map((metric, index) => {
                    const color = chartConfig[metric]?.color ?? CHART_COLORS[index % CHART_COLORS.length];
                    const gradientId = `colorValue-${metric}`;
                    return (
                      <Fragment key={metric}>
                        <defs>
                          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <Area 
                          type="monotone" 
                          dataKey={metric}
                          stroke={color}
                          strokeWidth={2}
                          fill={`url(#${gradientId})`}
                          name={metric}
                          connectNulls
                        />
                      </Fragment>
                    );
                  })}
                </AreaChart>
              ) : (
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
              )}
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
  const [languages, setLanguages] = useState<string[]>(["sql"]);
  const [selectedLanguage, setSelectedLanguage] = useState("sql");
  const [languagesLoading, setLanguagesLoading] = useState(false);
  const [languagesError, setLanguagesError] = useState<string | null>(null);
  const [selectedRangeKey, setSelectedRangeKey] = useState<TimeRangeKey>("1h");

  // Visualization type
  const [visualizationType, setVisualizationType] = useState<VisualizationType>("table");

  // Table display settings that persist across query runs
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<number>>(new Set());
  const [lastColumnSignature, setLastColumnSignature] = useState<string>("");

  // Pagination settings
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Load query and language from localStorage after mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedQuery = localStorage.getItem(QUERY_STORAGE_KEY);
      if (savedQuery) {
        setQuery(savedQuery);
      }
      const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage) {
        setSelectedLanguage(savedLanguage);
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

  // Save language to localStorage whenever it changes (but not on initial mount)
  useEffect(() => {
    if (typeof window !== "undefined" && !isInitialMount.current) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLanguage);
    }
  }, [selectedLanguage]);

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

  const loadLanguages = useCallback(async () => {
    setLanguagesLoading(true);
    setLanguagesError(null);
    try {
      const fetched = await fetchTimeSeriesLanguages();
      const combined = Array.from(new Set(["sql", ...fetched]));
      setLanguages(combined);
      setSelectedLanguage((current) =>
        combined.includes(current) ? current : "sql"
      );
    } catch (err) {
      console.error("Failed to fetch languages", err);
      setLanguages(["sql"]);
      setSelectedLanguage("sql");
      setLanguagesError("Using SQL because languages could not be loaded.");
    } finally {
      setLanguagesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLanguages();
  }, [loadLanguages]);

  const formatMetricLabel = useCallback((metric: TimeSeriesMetric): string => {
    const namePart = metric.__name__ ?? "";
    const otherParts = Object.entries(metric)
      .filter(([key]) => key !== "__name__")
      .map(([key, value]) => `${key}=${value}`);

    return [namePart, otherParts.join(",")].filter(Boolean).join(" ").trim() || "metric";
  }, []);

  const transformTimeSeriesResponse = useCallback((tsResponse: TimeSeriesQueryResponse): PinotQueryResponse => {
    const rows: unknown[][] = [];
    const results = tsResponse.data?.result ?? [];

    results.forEach(({ metric, values }) => {
      const metricLabel = formatMetricLabel(metric);
      values.forEach(([timestamp, value]) => {
        const numericValue = Number(value);
        rows.push([
          metricLabel,
          timestamp,
          Number.isFinite(numericValue) ? numericValue : value,
        ]);
      });
    });

    return {
      exceptions: [],
      minConsumingFreshnessTimeMs: 0,
      numConsumingSegmentsQueried: 0,
      numDocsScanned: rows.length,
      numEntriesScannedInFilter: 0,
      numEntriesScannedPostFilter: 0,
      numGroupsLimitReached: false,
      numSegmentsMatched: 0,
      numSegmentsProcessed: 0,
      numSegmentsQueried: 0,
      numServersQueried: 0,
      numServersResponded: 0,
      resultTable: {
        dataSchema: {
          columnNames: ["metric", "timestamp", "value"],
          columnDataTypes: ["STRING", "LONG", "DOUBLE"],
        },
        rows,
      },
      segmentStatistics: [],
      timeUsedMs: 0,
      totalDocs: rows.length,
      traceInfo: {},
    };
  }, [formatMetricLabel]);

  const handleRunQuery = useCallback(async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

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
      if (selectedLanguage === "sql") {
        const { response, error: queryError } = await executePinotQuery(
          trimmedQuery,
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
      } else {
        const end = Math.floor(Date.now() / 1000);
        const durationSeconds =
          TIME_RANGE_OPTIONS.find((opt) => opt.key === selectedRangeKey)?.seconds ??
          DEFAULT_TIMESERIES_WINDOW_SECONDS;
        const start = end - durationSeconds;

        const { response, error: queryError } = await executeTimeSeriesRangeQueryWithLanguage({
          language: selectedLanguage,
          query: trimmedQuery,
          start,
          end,
          step: DEFAULT_TIMESERIES_STEP,
        });

        if (queryError) {
          setError(queryError);
        }

        if (response) {
          const normalized = transformTimeSeriesResponse(response);
          handleNewResults(normalized);
        } else {
          setResults(null);
        }
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
  }, [query, timeoutUnit, timeoutValue, handleNewResults, selectedLanguage, transformTimeSeriesResponse]);

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
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <Label>Data Source</Label>
          <DatasourceSelector />
        </div>
        <div className="flex flex-col gap-2 min-w-[220px]">
          <Label>Query Language</Label>
          <Select
            value={selectedLanguage}
            onValueChange={setSelectedLanguage}
            disabled={languagesLoading}
          >
            <SelectTrigger className="w-[220px]" aria-label="Query language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {languagesError && (
            <p className="text-xs text-muted-foreground">{languagesError}</p>
          )}
        </div>
      </div>
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
            <ResizablePanel defaultSize={25} minSize={15} className="p-2 flex items-start">
              <QueryOptionsPanel
                timeoutValue={timeoutValue}
                timeoutUnit={timeoutUnit}
                onTimeoutValueChange={setTimeoutValue}
                onTimeoutUnitChange={setTimeoutUnit}
                selectedRangeKey={selectedRangeKey}
                onRangeChange={setSelectedRangeKey}
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
