"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Table2, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Search, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

type SortField = "name" | "reportedSize" | "estimatedSize" | "status"
type SortOrder = "asc" | "desc"

interface TableInfo {
  name: string
  fullName: string
  type: "REALTIME" | "OFFLINE" | "DIMENSION" | "UNKNOWN"
}

interface TableSizeInfo {
  reportedSizeInBytes: number
  estimatedSizeInBytes: number
}

interface TableStateInfo {
  status: "GOOD" | "BAD" | "UNKNOWN"
}

interface TableMetadata {
  size?: TableSizeInfo
  state?: TableStateInfo
  loading: boolean
  error?: string
}

function parseTableName(fullName: string): TableInfo {
  if (fullName.endsWith("_REALTIME")) {
    return { name: fullName.replace(/_REALTIME$/, ""), fullName, type: "REALTIME" }
  }
  if (fullName.endsWith("_OFFLINE")) {
    return { name: fullName.replace(/_OFFLINE$/, ""), fullName, type: "OFFLINE" }
  }
  if (fullName.endsWith("_DIMENSION")) {
    return { name: fullName.replace(/_DIMENSION$/, ""), fullName, type: "DIMENSION" }
  }
  return { name: fullName, fullName, type: "UNKNOWN" }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export default function TablesPage() {
  const params = useParams()
  const clusterId = params.clusterId as string

  const [tables, setTables] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [tableMetadata, setTableMetadata] = React.useState<Record<string, TableMetadata>>({})
  
  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(25)
  
  // Sorting
  const [sortField, setSortField] = React.useState<SortField>("name")
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("asc")
  
  // Filtering
  const [searchQuery, setSearchQuery] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState<string>("all")

  React.useEffect(() => {
    async function fetchTables() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/clusters/${clusterId}/tables`)
        if (!response.ok) {
          throw new Error("Failed to fetch tables")
        }
        const data = await response.json()
        setTables(data.tables || [])
      } catch (err) {
        console.error("Error fetching tables:", err)
        setError("Failed to fetch tables from cluster")
      } finally {
        setLoading(false)
      }
    }
    fetchTables()
  }, [clusterId])

  // Fetch metadata for a single table
  const fetchTableMetadata = React.useCallback(async (tableName: string) => {
    setTableMetadata(prev => ({
      ...prev,
      [tableName]: { loading: true }
    }))

    try {
      const [sizeResponse, stateResponse] = await Promise.all([
        fetch(`/api/clusters/${clusterId}/tables/${tableName}/size`),
        fetch(`/api/clusters/${clusterId}/tables/${tableName}/state`)
      ])

      let size: TableSizeInfo | undefined
      let state: TableStateInfo | undefined
      let errorMsg: string | undefined

      if (sizeResponse.ok) {
        const sizeData = await sizeResponse.json()
        size = {
          reportedSizeInBytes: sizeData.reportedSizeInBytes,
          estimatedSizeInBytes: sizeData.estimatedSizeInBytes
        }
      } else {
        errorMsg = "Failed to fetch size"
      }

      if (stateResponse.ok) {
        const stateData = await stateResponse.json()
        state = { status: stateData.status }
      } else {
        errorMsg = errorMsg ? `${errorMsg}, state` : "Failed to fetch state"
      }

      setTableMetadata(prev => ({
        ...prev,
        [tableName]: { size, state, loading: false, error: errorMsg }
      }))
    } catch (err) {
      console.error(`Error fetching metadata for ${tableName}:`, err)
      setTableMetadata(prev => ({
        ...prev,
        [tableName]: { loading: false, error: "Failed to fetch metadata" }
      }))
    }
  }, [clusterId])

  // Parse and process tables
  const parsedTables = React.useMemo(() => {
    return tables.map(parseTableName)
  }, [tables])

  // Filter tables
  const filteredTables = React.useMemo(() => {
    return parsedTables.filter((table) => {
      const matchesSearch = table.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = typeFilter === "all" || table.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [parsedTables, searchQuery, typeFilter])

  // Sort tables
  const sortedTables = React.useMemo(() => {
    return [...filteredTables].sort((a, b) => {
      let comparison = 0
      if (sortField === "name") {
        comparison = a.name.localeCompare(b.name)
      } else if (sortField === "reportedSize") {
        const aSize = tableMetadata[a.fullName]?.size?.reportedSizeInBytes ?? 0
        const bSize = tableMetadata[b.fullName]?.size?.reportedSizeInBytes ?? 0
        comparison = aSize - bSize
      } else if (sortField === "estimatedSize") {
        const aSize = tableMetadata[a.fullName]?.size?.estimatedSizeInBytes ?? 0
        const bSize = tableMetadata[b.fullName]?.size?.estimatedSizeInBytes ?? 0
        comparison = aSize - bSize
      } else if (sortField === "status") {
        const aStatus = tableMetadata[a.fullName]?.state?.status ?? "UNKNOWN"
        const bStatus = tableMetadata[b.fullName]?.state?.status ?? "UNKNOWN"
        comparison = aStatus.localeCompare(bStatus)
      }
      return sortOrder === "asc" ? comparison : -comparison
    })
  }, [filteredTables, sortField, sortOrder, tableMetadata])

  // Paginate tables
  const paginatedTables = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedTables.slice(startIndex, startIndex + pageSize)
  }, [sortedTables, currentPage, pageSize])

  const totalPages = Math.ceil(sortedTables.length / pageSize)

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, typeFilter, pageSize])

  // Fetch metadata for visible tables
  React.useEffect(() => {
    paginatedTables.forEach((table) => {
      if (!tableMetadata[table.fullName] && !loading) {
        fetchTableMetadata(table.fullName)
      }
    })
  }, [paginatedTables, tableMetadata, loading, fetchTableMetadata])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortOrder === "asc" 
      ? <ArrowUp className="ml-2 h-4 w-4" /> 
      : <ArrowDown className="ml-2 h-4 w-4" />
  }

  // Get unique types for filter
  const availableTypes = React.useMemo(() => {
    const types = new Set(parsedTables.map((t) => t.type))
    return Array.from(types).sort()
  }, [parsedTables])

  return (
    <div className="p-6">
      <div className="mb-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/manage/${clusterId}`}>{clusterId}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Tables</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Table2 className="h-6 w-6" />
          Tables
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {loading ? "Loading..." : `${sortedTables.length} tables found`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {availableTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-[400px] border border-dashed rounded-lg">
          <p className="text-destructive">{error}</p>
        </div>
      ) : sortedTables.length === 0 ? (
        <div className="flex items-center justify-center h-[400px] border border-dashed rounded-lg">
          <p className="text-muted-foreground">
            {searchQuery || typeFilter !== "all" 
              ? "No tables match your filters" 
              : "No tables found in this cluster"}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("name")}
                      className="h-8 p-0 font-medium hover:bg-transparent"
                    >
                      Table Name
                      <SortIcon field="name" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("reportedSize")}
                      className="h-8 p-0 font-medium hover:bg-transparent"
                    >
                      Reported Size
                      <SortIcon field="reportedSize" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("estimatedSize")}
                      className="h-8 p-0 font-medium hover:bg-transparent"
                    >
                      Estimated Size
                      <SortIcon field="estimatedSize" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("status")}
                      className="h-8 p-0 font-medium hover:bg-transparent"
                    >
                      Status
                      <SortIcon field="status" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTables.map((table, index) => {
                  const metadata = tableMetadata[table.fullName]
                  return (
                    <TableRow key={`${table.fullName}-${index}`}>
                      <TableCell>
                        <Link
                          href={`/manage/${clusterId}/tables/${table.name}`}
                          className="font-mono hover:underline text-primary"
                        >
                          {table.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {metadata?.loading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : metadata?.size ? (
                          <span className="font-mono text-sm">
                            {formatBytes(metadata.size.reportedSizeInBytes)}
                          </span>
                        ) : metadata?.error ? (
                          <span className="text-muted-foreground text-sm">—</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {metadata?.loading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : metadata?.size ? (
                          <span className="font-mono text-sm">
                            {formatBytes(metadata.size.estimatedSizeInBytes)}
                          </span>
                        ) : metadata?.error ? (
                          <span className="text-muted-foreground text-sm">—</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {metadata?.loading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : metadata?.state ? (
                          metadata.state.status === "GOOD" ? (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              GOOD
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              BAD
                            </Badge>
                          )
                        ) : metadata?.error ? (
                          <span className="text-muted-foreground text-sm">—</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => setPageSize(Number(value))}
              >
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages || 1}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
