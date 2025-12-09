"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { Server, Network, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Search } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type SortOrder = "asc" | "desc"

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

interface TenantListProps {
  tenants: string[]
  loading: boolean
  error: string | null
  searchQuery: string
  type: "SERVER" | "BROKER"
  clusterId: string
}

function TenantList({ tenants, loading, error, searchQuery, type, clusterId }: TenantListProps) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(25)
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("asc")

  // Filter tenants by search
  const filteredTenants = React.useMemo(() => {
    return tenants.filter((tenant) =>
      tenant.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [tenants, searchQuery])

  // Sort tenants
  const sortedTenants = React.useMemo(() => {
    return [...filteredTenants].sort((a, b) => {
      const comparison = a.localeCompare(b)
      return sortOrder === "asc" ? comparison : -comparison
    })
  }, [filteredTenants, sortOrder])

  // Paginate tenants
  const paginatedTenants = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedTenants.slice(startIndex, startIndex + pageSize)
  }, [sortedTenants, currentPage, pageSize])

  const totalPages = Math.ceil(sortedTenants.length / pageSize)

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

  const Icon = type === "SERVER" ? Server : Network

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px] border border-dashed rounded-lg">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (sortedTenants.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] border border-dashed rounded-lg">
        <p className="text-muted-foreground">
          {searchQuery 
            ? "No tenants match your search" 
            : `No ${type.toLowerCase()} tenants found in this cluster`}
        </p>
      </div>
    )
  }

  return (
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
                  Tenant Name
                  <SortIcon />
                </Button>
              </TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTenants.map((tenant) => (
              <TableRow key={tenant}>
                <TableCell>
                  <Link 
                    href={`/manage/${clusterId}/tenants/${tenant}?type=${type}`}
                    className="font-mono flex items-center gap-2 hover:underline text-primary"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {tenant}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={type === "SERVER" ? "default" : "secondary"}>
                    {type}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
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
  )
}

export default function TenantsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const clusterId = params.clusterId as string
  const initialType = searchParams.get("type") === "BROKER" ? "BROKER" : "SERVER"

  const [serverTenants, setServerTenants] = React.useState<string[]>([])
  const [brokerTenants, setBrokerTenants] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeTab, setActiveTab] = React.useState<string>(initialType)

  React.useEffect(() => {
    async function fetchTenants() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/clusters/${clusterId}/tenants`)
        if (!response.ok) {
          throw new Error("Failed to fetch tenants")
        }
        const data = await response.json()
        setServerTenants(data.SERVER_TENANTS || [])
        setBrokerTenants(data.BROKER_TENANTS || [])
      } catch (err) {
        console.error("Error fetching tenants:", err)
        setError("Failed to fetch tenants from cluster")
      } finally {
        setLoading(false)
      }
    }
    fetchTenants()
  }, [clusterId])

  const totalTenants = serverTenants.length + brokerTenants.length

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
          <span>Tenants</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Server className="h-6 w-6" />
          Tenants
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {loading ? "Loading..." : `${totalTenants} tenants found (${serverTenants.length} server, ${brokerTenants.length} broker)`}
        </p>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tenants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs for Server/Broker */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="SERVER" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Server ({serverTenants.length})
          </TabsTrigger>
          <TabsTrigger value="BROKER" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Broker ({brokerTenants.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="SERVER">
          <TenantList
            tenants={serverTenants}
            loading={loading}
            error={error}
            searchQuery={searchQuery}
            type="SERVER"
            clusterId={clusterId}
          />
        </TabsContent>
        <TabsContent value="BROKER">
          <TenantList
            tenants={brokerTenants}
            loading={loading}
            error={error}
            searchQuery={searchQuery}
            type="BROKER"
            clusterId={clusterId}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
