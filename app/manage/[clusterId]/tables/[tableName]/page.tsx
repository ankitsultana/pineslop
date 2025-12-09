"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Table2, Copy, Check, Search, ChevronLeft, ChevronRight, Layers, FileJson } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TableConfig {
  offline?: Record<string, unknown>
  realtime?: Record<string, unknown>
  tableName?: string
}

interface FieldSpec {
  name: string
  dataType: string
  singleValueField?: boolean
}

interface TableSchema {
  schemaName?: string
  dimensionFieldSpecs?: FieldSpec[]
  metricFieldSpecs?: FieldSpec[]
  dateTimeFieldSpecs?: FieldSpec[]
  primaryKeyColumns?: string[]
}

interface SchemaField {
  column: string
  type: string
  fieldType: "DIMENSION" | "METRIC" | "DATE_TIME"
  multiValue: boolean
}

interface SegmentsData {
  OFFLINE?: string[]
  REALTIME?: string[]
}

interface SegmentInfo {
  name: string
  type: "OFFLINE" | "REALTIME"
}

export default function TableDetailPage() {
  const params = useParams()
  const clusterId = params.clusterId as string
  const tableName = params.tableName as string

  const [config, setConfig] = React.useState<TableConfig | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState<string | null>(null)

  // Schema state
  const [schema, setSchema] = React.useState<TableSchema | null>(null)
  const [schemaLoading, setSchemaLoading] = React.useState(true)
  const [schemaError, setSchemaError] = React.useState<string | null>(null)

  // Config tab state
  const [activeConfigTab, setActiveConfigTab] = React.useState<string | null>(null)

  // Segments state
  const [segments, setSegments] = React.useState<SegmentInfo[]>([])
  const [segmentsLoading, setSegmentsLoading] = React.useState(true)
  const [segmentsError, setSegmentsError] = React.useState<string | null>(null)
  const [segmentSearch, setSegmentSearch] = React.useState("")
  const [segmentTypeFilter, setSegmentTypeFilter] = React.useState<string>("all")
  const [segmentPage, setSegmentPage] = React.useState(1)
  const segmentPageSize = 25

  React.useEffect(() => {
    async function fetchTableConfig() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/clusters/${clusterId}/tableConfigs/${encodeURIComponent(tableName)}`)
        if (!response.ok) {
          throw new Error("Failed to fetch table config")
        }
        const data = await response.json()
        setConfig(data)
      } catch (err) {
        console.error("Error fetching table config:", err)
        setError("Failed to fetch table config from cluster")
      } finally {
        setLoading(false)
      }
    }
    fetchTableConfig()
  }, [clusterId, tableName])

  React.useEffect(() => {
    async function fetchSchema() {
      setSchemaLoading(true)
      setSchemaError(null)
      try {
        const response = await fetch(`/api/clusters/${clusterId}/tables/${encodeURIComponent(tableName)}/schema`)
        if (!response.ok) {
          throw new Error("Failed to fetch schema")
        }
        const data: TableSchema = await response.json()
        setSchema(data)
      } catch (err) {
        console.error("Error fetching schema:", err)
        setSchemaError("Failed to fetch schema from cluster")
      } finally {
        setSchemaLoading(false)
      }
    }
    fetchSchema()
  }, [clusterId, tableName])

  React.useEffect(() => {
    async function fetchSegments() {
      setSegmentsLoading(true)
      setSegmentsError(null)
      try {
        const response = await fetch(`/api/clusters/${clusterId}/tables/${encodeURIComponent(tableName)}/segments`)
        if (!response.ok) {
          throw new Error("Failed to fetch segments")
        }
        const data: SegmentsData = await response.json()
        
        // Flatten segments into a single array with type info
        const allSegments: SegmentInfo[] = []
        if (data.OFFLINE) {
          data.OFFLINE.forEach(name => allSegments.push({ name, type: "OFFLINE" }))
        }
        if (data.REALTIME) {
          data.REALTIME.forEach(name => allSegments.push({ name, type: "REALTIME" }))
        }
        
        setSegments(allSegments)
      } catch (err) {
        console.error("Error fetching segments:", err)
        setSegmentsError("Failed to fetch segments from cluster")
      } finally {
        setSegmentsLoading(false)
      }
    }
    fetchSegments()
  }, [clusterId, tableName])

  // Flatten schema fields into a single array for display
  const schemaFields = React.useMemo<SchemaField[]>(() => {
    if (!schema) return []
    
    const fields: SchemaField[] = []
    
    if (schema.dimensionFieldSpecs) {
      schema.dimensionFieldSpecs.forEach(spec => {
        fields.push({
          column: spec.name,
          type: spec.dataType,
          fieldType: "DIMENSION",
          multiValue: spec.singleValueField === false,
        })
      })
    }
    
    if (schema.metricFieldSpecs) {
      schema.metricFieldSpecs.forEach(spec => {
        fields.push({
          column: spec.name,
          type: spec.dataType,
          fieldType: "METRIC",
          multiValue: spec.singleValueField === false,
        })
      })
    }
    
    if (schema.dateTimeFieldSpecs) {
      schema.dateTimeFieldSpecs.forEach(spec => {
        fields.push({
          column: spec.name,
          type: spec.dataType,
          fieldType: "DATE_TIME",
          multiValue: spec.singleValueField === false,
        })
      })
    }
    
    return fields
  }, [schema])

  // Filter and paginate segments
  const filteredSegments = React.useMemo(() => {
    return segments.filter(segment => {
      const matchesSearch = segment.name.toLowerCase().includes(segmentSearch.toLowerCase())
      const matchesType = segmentTypeFilter === "all" || segment.type === segmentTypeFilter
      return matchesSearch && matchesType
    })
  }, [segments, segmentSearch, segmentTypeFilter])

  const paginatedSegments = React.useMemo(() => {
    const startIndex = (segmentPage - 1) * segmentPageSize
    return filteredSegments.slice(startIndex, startIndex + segmentPageSize)
  }, [filteredSegments, segmentPage, segmentPageSize])

  const totalSegmentPages = Math.ceil(filteredSegments.length / segmentPageSize)

  // Reset page when filters change
  React.useEffect(() => {
    setSegmentPage(1)
  }, [segmentSearch, segmentTypeFilter])

  const handleCopy = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const hasOffline = config?.offline && Object.keys(config.offline).length > 0
  const hasRealtime = config?.realtime && Object.keys(config.realtime).length > 0
  const defaultTab = hasRealtime ? "realtime" : hasOffline ? "offline" : "realtime"

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
          <a href={`/manage/${clusterId}/tables`} className="hover:underline">Tables</a>
          <span>/</span>
          <span>{tableName}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Table2 className="h-6 w-6" />
          {tableName}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Table configuration
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Table Config Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Table2 className="h-5 w-5" />
                Configuration
              </CardTitle>
              <CardDescription>
                Table configuration JSON
              </CardDescription>
            </div>
            {!loading && !error && (hasOffline || hasRealtime) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentTab = activeConfigTab || defaultTab
                  const configToCopy = currentTab === "realtime" ? config?.realtime : config?.offline
                  handleCopy(JSON.stringify(configToCopy, null, 2), "config")
                }}
              >
                {copied === "config" ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy JSON
                  </>
                )}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-[200px]" />
                <Skeleton className="h-[500px] w-full" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-[400px] border border-dashed rounded-lg">
                <p className="text-destructive">{error}</p>
              </div>
            ) : !hasOffline && !hasRealtime ? (
              <div className="flex items-center justify-center h-[400px] border border-dashed rounded-lg">
                <p className="text-muted-foreground">No configuration found for this table</p>
              </div>
            ) : (
              <Tabs defaultValue={defaultTab} className="w-full" onValueChange={setActiveConfigTab}>
                <TabsList className="mb-4">
                  {hasRealtime && (
                    <TabsTrigger value="realtime">Realtime</TabsTrigger>
                  )}
                  {hasOffline && (
                    <TabsTrigger value="offline">Offline</TabsTrigger>
                  )}
                </TabsList>

                {hasRealtime && (
                  <TabsContent value="realtime" className="mt-0">
                    <ScrollArea className="h-[500px] w-full rounded-md border">
                      <pre className="p-4 text-sm font-mono">
                        {JSON.stringify(config.realtime, null, 2)}
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                )}

                {hasOffline && (
                  <TabsContent value="offline" className="mt-0">
                    <ScrollArea className="h-[500px] w-full rounded-md border">
                      <pre className="p-4 text-sm font-mono">
                        {JSON.stringify(config.offline, null, 2)}
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                )}
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Schema Section */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="h-5 w-5" />
                  Schema
                </CardTitle>
                <CardDescription>
                  {schema?.schemaName || tableName} ({schemaFields.length} columns)
                </CardDescription>
              </div>
              {schema && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(JSON.stringify(schema, null, 2), "schema")}
                >
                  {copied === "schema" ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy JSON
                    </>
                  )}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {schemaLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : schemaError ? (
                <div className="flex items-center justify-center h-[200px] border border-dashed rounded-lg">
                  <p className="text-destructive">{schemaError}</p>
                </div>
              ) : schemaFields.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] border border-dashed rounded-lg">
                  <p className="text-muted-foreground">No schema found for this table</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] w-full">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Column</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Field Type</TableHead>
                          <TableHead>Multi Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {schemaFields.map((field, index) => (
                          <TableRow key={`${field.column}-${index}`}>
                            <TableCell className="font-mono text-sm font-medium">
                              {field.column}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{field.type}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  field.fieldType === "DIMENSION" 
                                    ? "default" 
                                    : field.fieldType === "METRIC" 
                                      ? "secondary" 
                                      : "outline"
                                }
                              >
                                {field.fieldType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {field.multiValue ? (
                                <Badge variant="default">Yes</Badge>
                              ) : (
                                <span className="text-muted-foreground">No</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Segments Section */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Segments</h2>
          {!segmentsLoading && (
            <span className="text-sm text-muted-foreground">
              ({filteredSegments.length} {filteredSegments.length === 1 ? "segment" : "segments"})
            </span>
          )}
        </div>

        {segmentsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : segmentsError ? (
          <div className="flex items-center justify-center h-[200px] border border-dashed rounded-lg">
            <p className="text-destructive">{segmentsError}</p>
          </div>
        ) : segments.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] border border-dashed rounded-lg">
            <p className="text-muted-foreground">No segments found for this table</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search segments..."
                  value={segmentSearch}
                  onChange={(e) => setSegmentSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={segmentTypeFilter} onValueChange={setSegmentTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="OFFLINE">OFFLINE</SelectItem>
                  <SelectItem value="REALTIME">REALTIME</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredSegments.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] border border-dashed rounded-lg">
                <p className="text-muted-foreground">No segments match your filters</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80%]">Segment Name</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedSegments.map((segment, index) => (
                        <TableRow key={`${segment.name}-${index}`}>
                          <TableCell className="font-mono text-sm">
                            <Link
                              href={`/manage/${clusterId}/tables/${tableName}/segments/${encodeURIComponent(segment.name)}?type=${segment.type}`}
                              className="hover:underline text-primary"
                            >
                              {segment.name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant={segment.type === "REALTIME" ? "default" : "secondary"}>
                              {segment.type}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalSegmentPages > 1 && (
                  <div className="flex items-center justify-end gap-2 mt-4">
                    <span className="text-sm text-muted-foreground">
                      Page {segmentPage} of {totalSegmentPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSegmentPage((p) => Math.max(1, p - 1))}
                        disabled={segmentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSegmentPage((p) => Math.min(totalSegmentPages, p + 1))}
                        disabled={segmentPage >= totalSegmentPages}
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
    </div>
  )
}

