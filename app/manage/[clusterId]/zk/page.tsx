"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { 
  FolderTree, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Loader2, 
  Folder, 
  File,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  Home
} from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ZkStat {
  czxid?: number
  mzxid?: number
  ctime?: number
  mtime?: number
  version?: number
  cversion?: number
  aversion?: number
  ephemeralOwner?: number
  dataLength?: number
  numChildren?: number
  pzxid?: number
}

type SortOrder = "asc" | "desc"

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
const MAX_CONTENT_DISPLAY_SIZE = 100 * 1024 // 100KB

export default function ZkBrowserPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const clusterId = params.clusterId as string
  
  // Current path from URL or default to "/"
  const currentPath = searchParams.get("path") || "/"
  
  // Children list state
  const [children, setChildren] = React.useState<string[]>([])
  const [loadingChildren, setLoadingChildren] = React.useState(true)
  const [childrenError, setChildrenError] = React.useState<string | null>(null)
  
  // Node details state
  const [stat, setStat] = React.useState<ZkStat | null>(null)
  const [content, setContent] = React.useState<string | null>(null)
  const [loadingStat, setLoadingStat] = React.useState(true)
  const [loadingContent, setLoadingContent] = React.useState(true)
  const [statError, setStatError] = React.useState<string | null>(null)
  const [contentError, setContentError] = React.useState<string | null>(null)
  const [contentTruncated, setContentTruncated] = React.useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(25)
  
  // Sorting
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("asc")
  
  // Search
  const [searchQuery, setSearchQuery] = React.useState("")
  
  // Copy state
  const [copied, setCopied] = React.useState(false)

  // Fetch children
  React.useEffect(() => {
    async function fetchChildren() {
      setLoadingChildren(true)
      setChildrenError(null)
      try {
        const response = await fetch(
          `/api/clusters/${clusterId}/zk/ls?path=${encodeURIComponent(currentPath)}`
        )
        if (!response.ok) {
          throw new Error("Failed to fetch ZK children")
        }
        const data = await response.json()
        setChildren(data.children || [])
      } catch (err) {
        console.error("Error fetching ZK children:", err)
        setChildrenError("Failed to fetch ZK children")
      } finally {
        setLoadingChildren(false)
      }
    }
    fetchChildren()
  }, [clusterId, currentPath])

  // Fetch stat
  React.useEffect(() => {
    async function fetchStat() {
      setLoadingStat(true)
      setStatError(null)
      try {
        const response = await fetch(
          `/api/clusters/${clusterId}/zk/stat?path=${encodeURIComponent(currentPath)}`
        )
        if (!response.ok) {
          throw new Error("Failed to fetch ZK stat")
        }
        const data = await response.json()
        setStat(data)
      } catch (err) {
        console.error("Error fetching ZK stat:", err)
        setStatError("Failed to fetch ZK stat")
      } finally {
        setLoadingStat(false)
      }
    }
    fetchStat()
  }, [clusterId, currentPath])

  // Fetch content
  React.useEffect(() => {
    async function fetchContent() {
      setLoadingContent(true)
      setContentError(null)
      setContentTruncated(false)
      try {
        const response = await fetch(
          `/api/clusters/${clusterId}/zk/get?path=${encodeURIComponent(currentPath)}`
        )
        if (!response.ok) {
          throw new Error("Failed to fetch ZK content")
        }
        const data = await response.json()
        let contentStr = data.content || ""
        
        // Truncate if too large
        if (contentStr.length > MAX_CONTENT_DISPLAY_SIZE) {
          contentStr = contentStr.substring(0, MAX_CONTENT_DISPLAY_SIZE)
          setContentTruncated(true)
        }
        
        setContent(contentStr)
      } catch (err) {
        console.error("Error fetching ZK content:", err)
        setContentError("Failed to fetch ZK content")
      } finally {
        setLoadingContent(false)
      }
    }
    fetchContent()
  }, [clusterId, currentPath])

  // Filter and sort children
  const filteredChildren = React.useMemo(() => {
    let result = children.filter((child) =>
      child.toLowerCase().includes(searchQuery.toLowerCase())
    )
    result.sort((a, b) => {
      const comparison = a.localeCompare(b)
      return sortOrder === "asc" ? comparison : -comparison
    })
    return result
  }, [children, searchQuery, sortOrder])

  // Paginate
  const paginatedChildren = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredChildren.slice(startIndex, startIndex + pageSize)
  }, [filteredChildren, currentPage, pageSize])

  const totalPages = Math.ceil(filteredChildren.length / pageSize)

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize, currentPath])

  // Navigation helper
  const navigateToPath = (path: string) => {
    router.push(`/manage/${clusterId}/zk?path=${encodeURIComponent(path)}`)
  }

  // Handle child click
  const handleChildClick = (childName: string) => {
    const newPath = currentPath === "/" ? `/${childName}` : `${currentPath}/${childName}`
    navigateToPath(newPath)
  }

  // Parse path into segments for breadcrumb
  const pathSegments = React.useMemo(() => {
    if (currentPath === "/") return []
    return currentPath.split("/").filter(Boolean)
  }, [currentPath])

  // Build path from segments up to index
  const buildPathUpTo = (index: number) => {
    if (index < 0) return "/"
    return "/" + pathSegments.slice(0, index + 1).join("/")
  }

  // Format timestamp
  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return "—"
    return new Date(timestamp).toLocaleString()
  }

  // Format bytes
  const formatBytes = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return "—"
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Copy content to clipboard
  const copyContent = async () => {
    if (!content) return
    try {
      // Fetch full content if truncated
      if (contentTruncated) {
        const response = await fetch(
          `/api/clusters/${clusterId}/zk/get?path=${encodeURIComponent(currentPath)}`
        )
        if (response.ok) {
          const data = await response.json()
          await navigator.clipboard.writeText(data.content || "")
        }
      } else {
        await navigator.clipboard.writeText(content)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  // Try to format content as JSON
  const formattedContent = React.useMemo(() => {
    if (!content) return null
    try {
      const parsed = JSON.parse(content)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return content
    }
  }, [content])

  const toggleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  return (
    <div className="p-6 h-[calc(100vh-4rem)]">
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
              <BreadcrumbPage>Zookeeper</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <FolderTree className="h-6 w-6" />
          Zookeeper Browser
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Browse the Zookeeper tree
        </p>
      </div>

      {/* Path Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm bg-muted/50 rounded-md p-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2"
          onClick={() => navigateToPath("/")}
        >
          <Home className="h-4 w-4" />
        </Button>
        <span className="text-muted-foreground">/</span>
        {pathSegments.map((segment, index) => (
          <React.Fragment key={index}>
            {index < pathSegments.length - 1 ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 font-mono"
                onClick={() => navigateToPath(buildPathUpTo(index))}
              >
                {segment}
              </Button>
            ) : (
              <span className="font-mono font-medium">{segment}</span>
            )}
            {index < pathSegments.length - 1 && (
              <span className="text-muted-foreground">/</span>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100%-10rem)]">
        {/* Left Panel - Children List */}
        <Card className="flex flex-col h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Children
              {!loadingChildren && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({filteredChildren.length} nodes)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            {/* Search and Filter */}
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search nodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8"
                />
              </div>
            </div>

            {loadingChildren ? (
              <div className="space-y-2 flex-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : childrenError ? (
              <div className="flex items-center justify-center flex-1 border border-dashed rounded-lg">
                <p className="text-destructive">{childrenError}</p>
              </div>
            ) : filteredChildren.length === 0 ? (
              <div className="flex items-center justify-center flex-1 border border-dashed rounded-lg">
                <p className="text-muted-foreground">
                  {searchQuery ? "No nodes match your search" : "No child nodes"}
                </p>
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1 min-h-0">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <Button
                              variant="ghost"
                              onClick={toggleSort}
                              className="h-8 p-0 font-medium hover:bg-transparent"
                            >
                              Node Name
                              {sortOrder === "asc" ? (
                                <ArrowUp className="ml-2 h-4 w-4" />
                              ) : (
                                <ArrowDown className="ml-2 h-4 w-4" />
                              )}
                            </Button>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedChildren.map((child, index) => (
                          <TableRow 
                            key={`${child}-${index}`}
                            className="cursor-pointer hover:bg-accent"
                            onClick={() => handleChildClick(child)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Folder className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono text-sm">{child}</span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Per page:</span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => setPageSize(Number(value))}
                    >
                      <SelectTrigger className="w-[60px] h-7">
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
                      {currentPage} / {totalPages || 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
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
          </CardContent>
        </Card>

        {/* Right Panel - Node Details */}
        <div className="flex flex-col gap-4 h-full min-h-0">
          {/* Stat Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <File className="h-5 w-5" />
                Node Stats
              </CardTitle>
              <CardDescription className="font-mono text-xs break-all">
                {currentPath}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStat ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-5 w-full" />
                  ))}
                </div>
              ) : statError ? (
                <p className="text-destructive text-sm">{statError}</p>
              ) : stat ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="text-muted-foreground">Data Length</div>
                  <div className="font-mono">{formatBytes(stat.dataLength)}</div>
                  
                  <div className="text-muted-foreground">Children</div>
                  <div className="font-mono">{stat.numChildren ?? "—"}</div>
                  
                  <div className="text-muted-foreground">Version</div>
                  <div className="font-mono">{stat.version ?? "—"}</div>
                  
                  <div className="text-muted-foreground">Created</div>
                  <div className="font-mono text-xs">{formatTimestamp(stat.ctime)}</div>
                  
                  <div className="text-muted-foreground">Modified</div>
                  <div className="font-mono text-xs">{formatTimestamp(stat.mtime)}</div>
                  
                  <div className="text-muted-foreground">Ephemeral Owner</div>
                  <div className="font-mono">{stat.ephemeralOwner ?? "—"}</div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No stats available</p>
              )}
            </CardContent>
          </Card>

          {/* Content Card */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Content</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7"
                  onClick={copyContent}
                  disabled={!content || loadingContent}
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              {contentTruncated && (
                <CardDescription className="text-amber-600">
                  Content truncated for display (full content copied when using Copy)
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              {loadingContent ? (
                <div className="space-y-2 h-full">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : contentError ? (
                <p className="text-destructive text-sm">{contentError}</p>
              ) : formattedContent ? (
                <ScrollArea className="h-full">
                  <pre className="text-xs font-mono bg-muted p-3 rounded-md whitespace-pre-wrap break-all">
                    {formattedContent}
                  </pre>
                </ScrollArea>
              ) : (
                <div className="flex items-center justify-center h-full border border-dashed rounded-lg">
                  <p className="text-muted-foreground text-sm">No content</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
