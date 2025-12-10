"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Moon, Sun, Github, BookOpen, ChevronsUpDown, Check, Server } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface ClusterInfo {
  id: string
}

export function NavigationMenuDemo() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Cluster combobox state
  const [open, setOpen] = React.useState(false)
  const [clusters, setClusters] = React.useState<ClusterInfo[]>([])
  const [clustersLoading, setClustersLoading] = React.useState(true)

  // Extract current cluster from pathname
  const currentCluster = React.useMemo(() => {
    const match = pathname.match(/^\/manage\/([^/]+)/)
    return match ? match[1] : null
  }, [pathname])

  // Check if we're on a manage route
  const isManageRoute = pathname.startsWith("/manage/") && currentCluster

  // Check if we're on the query page
  const isQueryRoute = pathname === "/query"

  // Check if we're on the visualize page
  const isVisualizeRoute = pathname === "/visualize"

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch clusters when on manage route
  React.useEffect(() => {
    if (!isManageRoute) return

    async function fetchClusters() {
      setClustersLoading(true)
      try {
        const response = await fetch("/api/clusters")
        const data = await response.json()
        const clusterInfos = (data.clusterIds || []).map((id: string) => ({ id }))
        setClusters(clusterInfos)
      } catch (error) {
        console.error("Failed to fetch clusters:", error)
      } finally {
        setClustersLoading(false)
      }
    }
    fetchClusters()
  }, [isManageRoute])

  const handleClusterSelect = (clusterId: string) => {
    setOpen(false)
    if (clusterId !== currentCluster) {
      router.push(`/manage/${clusterId}`)
    }
  }

  return (
    <div className="flex items-center justify-between w-full">
      {/* Left side - Page header or Cluster selector */}
      <div className="flex items-center gap-2">
        {isQueryRoute && (
          <h1 className="text-lg font-semibold">SQL Console</h1>
        )}
        {isVisualizeRoute && (
          <h1 className="text-lg font-semibold">Visualize</h1>
        )}
        {isManageRoute && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-[400px] justify-between font-mono"
              >
                <Server className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <span className="truncate">
                  {currentCluster || "Select cluster..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <Command>
                <CommandInput placeholder="Search clusters..." />
                <CommandList>
                  <CommandEmpty>
                    {clustersLoading ? "Loading..." : "No cluster found."}
                  </CommandEmpty>
                  <CommandGroup>
                    {clusters.map((cluster) => (
                      <CommandItem
                        key={cluster.id}
                        value={cluster.id}
                        onSelect={() => handleClusterSelect(cluster.id)}
                        className="font-mono"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            currentCluster === cluster.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {cluster.id}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Right side - Icons */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="https://docs.pinot.apache.org/" target="_blank" aria-label="Documentation">
            <BookOpen className="size-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <a href="https://github.com/apache/pinot" target="_blank" rel="noopener noreferrer" aria-label="GitHub Repository">
            <Github className="size-4" />
          </a>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {mounted ? (
            theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )
          ) : (
            <Sun className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
