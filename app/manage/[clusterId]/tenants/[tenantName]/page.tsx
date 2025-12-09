"use client"

import * as React from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Server, Network, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Search, Users } from "lucide-react"
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

type SortOrder = "asc" | "desc"

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

interface TenantInstances {
  ServerInstances: string[]
  BrokerInstances: string[]
}

export default function TenantDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const clusterId = params.clusterId as string
  const tenantName = params.tenantName as string
  const type = searchParams.get("type") as "SERVER" | "BROKER" | null

  const [instances, setInstances] = React.useState<TenantInstances>({
    ServerInstances: [],
    BrokerInstances: [],
  })
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(25)
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("asc")

  React.useEffect(() => {
    async function fetchInstances() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/clusters/${clusterId}/tenants/${encodeURIComponent(tenantName)}`)
        if (!response.ok) {
          throw new Error("Failed to fetch tenant instances")
        }
        const data = await response.json()
        setInstances({
          ServerInstances: data.ServerInstances || [],
          BrokerInstances: data.BrokerInstances || [],
        })
      } catch (err) {
        console.error("Error fetching tenant instances:", err)
        setError("Failed to fetch tenant instances from cluster")
      } finally {
        setLoading(false)
      }
    }
    fetchInstances()
  }, [clusterId, tenantName])

  // Combine instances based on type or show all
  const allInstances = React.useMemo(() => {
    const serverInstances = instances.ServerInstances.map((inst) => ({
      name: inst,
      type: "SERVER" as const,
    }))
    const brokerInstances = instances.BrokerInstances.map((inst) => ({
      name: inst,
      type: "BROKER" as const,
    }))

    if (type === "SERVER") {
      return serverInstances
    } else if (type === "BROKER") {
      return brokerInstances
    }
    return [...serverInstances, ...brokerInstances]
  }, [instances, type])

  // Filter instances by search
  const filteredInstances = React.useMemo(() => {
    return allInstances.filter((inst) =>
      inst.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [allInstances, searchQuery])

  // Sort instances
  const sortedInstances = React.useMemo(() => {
    return [...filteredInstances].sort((a, b) => {
      const comparison = a.name.localeCompare(b.name)
      return sortOrder === "asc" ? comparison : -comparison
    })
  }, [filteredInstances, sortOrder])

  // Paginate instances
  const paginatedInstances = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedInstances.slice(startIndex, startIndex + pageSize)
  }, [sortedInstances, currentPage, pageSize])

  const totalPages = Math.ceil(sortedInstances.length / pageSize)

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize])

  const handleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  const SortIcon = () => {
    return sortOrder === "asc" 
      ? <ArrowUp className="ml-2 h-4 w-4" /> 
      : <ArrowDown className="ml-2 h-4 w-4" />
  }

  const typeLabel = type === "SERVER" ? "Server" : type === "BROKER" ? "Broker" : null

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
          <a href="/manage" className="hover:underline">Manage</a>
          <span>/</span>
          <a href={`/manage/${clusterId}`} className="hover:underline">{clusterId}</a>
          <span>/</span>
          <a href={`/manage/${clusterId}/tenants`} className="hover:underline">Tenants</a>
          <span>/</span>
          <span>{tenantName}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6" />
          {tenantName}
          {typeLabel && (
            <Badge variant={type === "SERVER" ? "default" : "secondary"}>
              {typeLabel}
            </Badge>
          )}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {loading 
            ? "Loading..." 
            : `${sortedInstances.length} instance${sortedInstances.length === 1 ? "" : "s"} found`}
        </p>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search instances..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
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
      ) : sortedInstances.length === 0 ? (
        <div className="flex items-center justify-center h-[400px] border border-dashed rounded-lg">
          <p className="text-muted-foreground">
            {searchQuery 
              ? "No instances match your search" 
              : "No instances found for this tenant"}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={handleSort}
                      className="h-8 p-0 font-medium hover:bg-transparent"
                    >
                      Instance Name
                      <SortIcon />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInstances.map((instance) => {
                  const Icon = instance.type === "SERVER" ? Server : Network
                  return (
                    <TableRow key={`${instance.name}-${instance.type}`}>
                      <TableCell className="font-mono flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {instance.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={instance.type === "SERVER" ? "default" : "secondary"}>
                          {instance.type}
                        </Badge>
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

