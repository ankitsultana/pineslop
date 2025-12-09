"use client"

import * as React from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Layers, Search, ChevronLeft, ChevronRight, Check, X, Server, FileText, HardDrive, Clock, Download, Copy } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ColumnInfo {
  name: string
  columnName?: string
  fieldName?: string
  fieldType?: string
  dataType?: string
  cardinality?: string
  totalDocs?: number
  hasDictionary?: boolean
  hasInvertedIndex?: boolean
  hasRangeIndex?: boolean
  hasBloomFilter?: boolean
  hasJsonIndex?: boolean
  hasH3Index?: boolean
  hasFSTIndex?: boolean
  hasTextIndex?: boolean
  [key: string]: string | number | boolean | undefined
}

interface SegmentMetadata {
  columns?: Record<string, ColumnInfo> | ColumnInfo[]
  indexes?: Record<string, unknown>
  [key: string]: unknown
}

interface TableStateResponse {
  status: string
  idealState: {
    OFFLINE?: Record<string, Record<string, string>>
    REALTIME?: Record<string, Record<string, string>>
  }
  externalView: {
    OFFLINE?: Record<string, Record<string, string>>
    REALTIME?: Record<string, Record<string, string>>
  }
}

interface ReplicaInfo {
  server: string
  state: string
}

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Helper function to format timestamp
function formatTimestamp(timestamp: number | string): string {
  const ts = typeof timestamp === "string" ? parseInt(timestamp, 10) : timestamp
  if (isNaN(ts)) return "—"
  const date = new Date(ts)
  return date.toLocaleString()
}

// Helper function to get timezone info
function getTimezoneInfo(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return "Unknown"
  }
}

// Helper function to format timestamp in UTC
function formatTimestampUTC(timestamp: number | string): string {
  const ts = typeof timestamp === "string" ? parseInt(timestamp, 10) : timestamp
  if (isNaN(ts)) return "—"
  const date = new Date(ts)
  return date.toISOString().replace("T", " ").replace("Z", " UTC")
}

// Helper function to format number with commas
function formatNumber(num: number): string {
  return num.toLocaleString()
}

// Known index fields to display in the columns table
const INDEX_FIELDS = [
  { key: "hasDictionary", label: "Dictionary" },
  { key: "hasInvertedIndex", label: "Inverted" },
  { key: "hasRangeIndex", label: "Range" },
  { key: "hasBloomFilter", label: "Bloom" },
  { key: "hasJsonIndex", label: "JSON" },
  { key: "hasH3Index", label: "H3" },
  { key: "hasFSTIndex", label: "FST" },
  { key: "hasTextIndex", label: "Text" },
]

export default function SegmentDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const clusterId = params.clusterId as string
  const tableName = params.tableName as string
  const segmentName = params.segmentName as string
  const segmentType = searchParams.get("type") || "OFFLINE"

  // Construct full table name with type suffix for API calls
  const fullTableName = `${tableName}_${segmentType}`

  const [metadata, setMetadata] = React.useState<SegmentMetadata | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Replica set state
  const [replicas, setReplicas] = React.useState<ReplicaInfo[]>([])
  const [replicasLoading, setReplicasLoading] = React.useState(true)

  // Cluster URL state
  const [clusterUrl, setClusterUrl] = React.useState<string>("")

  // Column table state
  const [columnSearch, setColumnSearch] = React.useState("")
  const [columnPage, setColumnPage] = React.useState(1)
  const columnPageSize = 10

  React.useEffect(() => {
    async function fetchMetadata() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(
          `/api/clusters/${clusterId}/tables/${encodeURIComponent(fullTableName)}/segments/${encodeURIComponent(segmentName)}/metadata`
        )
        if (!response.ok) {
          throw new Error("Failed to fetch segment metadata")
        }
        const data = await response.json()
        setMetadata(data)
      } catch (err) {
        console.error("Error fetching segment metadata:", err)
        setError("Failed to fetch segment metadata from cluster")
      } finally {
        setLoading(false)
      }
    }
    fetchMetadata()
  }, [clusterId, fullTableName, segmentName])

  // Fetch cluster URL
  React.useEffect(() => {
    async function fetchClusterInfo() {
      try {
        const response = await fetch(`/api/clusters/${clusterId}/info`)
        if (response.ok) {
          const data = await response.json()
          setClusterUrl(data.url || "")
        }
      } catch (err) {
        console.error("Error fetching cluster info:", err)
      }
    }
    fetchClusterInfo()
  }, [clusterId])

  // Fetch replica set from external view
  React.useEffect(() => {
    async function fetchReplicaSet() {
      setReplicasLoading(true)
      try {
        const response = await fetch(
          `/api/clusters/${clusterId}/tables/${encodeURIComponent(fullTableName)}/state`
        )
        if (!response.ok) {
          console.error("Failed to fetch table state for replicas")
          return
        }
        const data: TableStateResponse = await response.json()
        
        // Get the segment replicas from the external view based on segment type
        const externalView = segmentType === "REALTIME" 
          ? data.externalView.REALTIME 
          : data.externalView.OFFLINE
        
        if (externalView && externalView[segmentName]) {
          const segmentReplicas = externalView[segmentName]
          const replicaList: ReplicaInfo[] = Object.entries(segmentReplicas).map(
            ([server, state]) => ({ server, state })
          )
          setReplicas(replicaList)
        }
      } catch (err) {
        console.error("Error fetching replica set:", err)
      } finally {
        setReplicasLoading(false)
      }
    }
    fetchReplicaSet()
  }, [clusterId, fullTableName, segmentName, segmentType])

  // Get metadata without columns and indexes for display
  const metadataWithoutColumns = React.useMemo(() => {
    if (!metadata) return null
    const { columns, indexes, ...rest } = metadata
    return rest
  }, [metadata])

  // Get columns as array
  const columns: ColumnInfo[] = React.useMemo(() => {
    if (!metadata?.columns) return []
    
    // Handle both array and object formats
    if (Array.isArray(metadata.columns)) {
      // If columns is an array, each item should have columnName or fieldName
      return metadata.columns.map((col: ColumnInfo) => ({
        ...col,
        name: col.columnName || col.fieldName || col.name || "unknown",
      }))
    }
    
    // If columns is an object with column names as keys
    return Object.entries(metadata.columns).map(([colName, info]) => ({
      ...(info as ColumnInfo),
      name: colName,
    }))
  }, [metadata])

  // Filter columns
  const filteredColumns = React.useMemo(() => {
    return columns.filter(col =>
      col.name.toLowerCase().includes(columnSearch.toLowerCase())
    )
  }, [columns, columnSearch])

  // Paginate columns
  const paginatedColumns = React.useMemo(() => {
    const startIndex = (columnPage - 1) * columnPageSize
    return filteredColumns.slice(startIndex, startIndex + columnPageSize)
  }, [filteredColumns, columnPage, columnPageSize])

  const totalColumnPages = Math.ceil(filteredColumns.length / columnPageSize)

  // Reset page when search changes
  React.useEffect(() => {
    setColumnPage(1)
  }, [columnSearch])

  // Determine which index columns have at least one true value
  const activeIndexFields = React.useMemo(() => {
    return INDEX_FIELDS.filter(field =>
      columns.some(col => col[field.key] === true)
    )
  }, [columns])

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
          <a href="/manage" className="hover:underline">Manage</a>
          <span>/</span>
          <a href={`/manage/${clusterId}`} className="hover:underline">{clusterId}</a>
          <span>/</span>
          <a href={`/manage/${clusterId}/tables`} className="hover:underline">Tables</a>
          <span>/</span>
          <a href={`/manage/${clusterId}/tables/${tableName}`} className="hover:underline">{tableName}</a>
          <span>/</span>
          <span className="truncate max-w-[300px]" title={segmentName}>{segmentName}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Layers className="h-6 w-6" />
          <span className="truncate" title={segmentName}>{segmentName}</span>
          <Badge variant={segmentType === "REALTIME" ? "default" : "secondary"}>
            {segmentType}
          </Badge>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Segment metadata and column indexes
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-[400px] border border-dashed rounded-lg">
          <p className="text-destructive">{error}</p>
        </div>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <Card>
              <CardContent className="py-2 px-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-500/10">
                    <FileText className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Docs</p>
                    <p className="text-lg font-semibold">
                      {metadata?.["segment.total.docs"] != null
                        ? formatNumber(Number(metadata["segment.total.docs"]))
                        : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-2 px-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-green-500/10">
                    <HardDrive className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Segment Size</p>
                    <p className="text-lg font-semibold">
                      {metadata?.["segment.size.in.bytes"] != null
                        ? formatBytes(Number(metadata["segment.size.in.bytes"]))
                        : metadata?.["segment.total.raw.doc.size"] != null
                        ? formatBytes(Number(metadata["segment.total.raw.doc.size"]))
                        : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-2 px-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-purple-500/10">
                    <Clock className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Create Time</p>
                    {metadata?.["segment.creation.time"] != null ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-base font-semibold cursor-help underline decoration-dotted underline-offset-4">
                              {formatTimestamp(metadata["segment.creation.time"] as number | string)}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-sm">
                            <div className="space-y-1">
                              <p><span className="text-muted-foreground">Timezone:</span> {getTimezoneInfo()}</p>
                              <p><span className="text-muted-foreground">UTC:</span> {formatTimestampUTC(metadata["segment.creation.time"] as number | string)}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <p className="text-base font-semibold">—</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Download URL */}
          <div className="flex items-center gap-2 mb-6">
            <div className="p-1.5 rounded-md bg-orange-500/10">
              <Download className="h-4 w-4 text-orange-500" />
            </div>
            <span className="text-sm text-muted-foreground shrink-0">Download URL</span>
            <div className="flex-1 min-w-0 relative">
              <code className="text-sm font-mono bg-muted px-3 py-1.5 pr-10 rounded border block truncate">
                {clusterUrl ? `${clusterUrl}/segments/${fullTableName}/${segmentName}` : `<cluster-url>/segments/${fullTableName}/${segmentName}`}
              </code>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 absolute right-1.5 top-1/2 -translate-y-1/2"
                      onClick={() => {
                        const url = clusterUrl 
                          ? `${clusterUrl}/segments/${fullTableName}/${segmentName}`
                          : `/segments/${fullTableName}/${segmentName}`
                        navigator.clipboard.writeText(url)
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy URL</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Replica Set and Metadata Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Replica Set Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Replica Set
                </CardTitle>
                <CardDescription>
                  Servers hosting this segment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {replicasLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : replicas.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No replicas found</p>
                ) : (
                  <div className="space-y-2">
                    {replicas.map((replica) => (
                      <div
                        key={replica.server}
                        className="flex items-center justify-between p-3 rounded-md border bg-muted/30"
                      >
                        <span className="font-mono text-sm truncate flex-1" title={replica.server}>
                          {replica.server}
                        </span>
                        <Badge
                          variant={replica.state === "ONLINE" ? "default" : "secondary"}
                          className={
                            replica.state === "ONLINE"
                              ? "bg-green-600 hover:bg-green-600 ml-2"
                              : replica.state === "CONSUMING"
                              ? "bg-blue-600 hover:bg-blue-600 ml-2"
                              : "ml-2"
                          }
                        >
                          {replica.state}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadata Card */}
            <Card>
              <CardHeader>
                <CardTitle>Segment Metadata</CardTitle>
                <CardDescription>
                  General information about this segment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] w-full rounded-md border">
                  <pre className="p-4 text-sm font-mono">
                    {JSON.stringify(metadataWithoutColumns, null, 2)}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Column Indexes Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold">Column Indexes</h2>
              {columns.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  ({filteredColumns.length} {filteredColumns.length === 1 ? "column" : "columns"})
                </span>
              )}
            </div>

            {columns.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] border border-dashed rounded-lg">
                <p className="text-muted-foreground">No column information available</p>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search columns..."
                      value={columnSearch}
                      onChange={(e) => setColumnSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {filteredColumns.length === 0 ? (
                  <div className="flex items-center justify-center h-[200px] border border-dashed rounded-lg">
                    <p className="text-muted-foreground">No columns match your search</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[200px]">Column Name</TableHead>
                            <TableHead>Field Type</TableHead>
                            <TableHead>Data Type</TableHead>
                            <TableHead>Cardinality</TableHead>
                            {activeIndexFields.map(field => (
                              <TableHead key={field.key} className="text-center">
                                {field.label}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedColumns.map((column) => (
                            <TableRow key={column.name}>
                              <TableCell className="font-mono text-sm">
                                {column.name}
                              </TableCell>
                              <TableCell>
                                {column.fieldType && (
                                  <Badge variant="outline">{column.fieldType}</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {column.dataType && (
                                  <Badge variant="secondary">{column.dataType}</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {column.cardinality && (
                                  <span className="text-sm">{column.cardinality}</span>
                                )}
                              </TableCell>
                              {activeIndexFields.map(field => (
                                <TableCell key={field.key} className="text-center">
                                  {column[field.key] === true ? (
                                    <Check className="h-4 w-4 text-green-600 mx-auto" />
                                  ) : column[field.key] === false ? (
                                    <X className="h-4 w-4 text-muted-foreground mx-auto" />
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalColumnPages > 1 && (
                      <div className="flex items-center justify-end gap-2 mt-4">
                        <span className="text-sm text-muted-foreground">
                          Page {columnPage} of {totalColumnPages}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setColumnPage((p) => Math.max(1, p - 1))}
                            disabled={columnPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setColumnPage((p) => Math.min(totalColumnPages, p + 1))}
                            disabled={columnPage >= totalColumnPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

