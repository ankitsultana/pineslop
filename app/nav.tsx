"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Moon, Sun, Github, BookOpen, Sheet, ChevronsUpDown, Check } from "lucide-react"
import { useTheme } from "next-themes"

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

// Pages where the cluster selector should be hidden
const HIDE_CLUSTER_SELECTOR_PATHS = ["/comments", "/activity"]

function ClusterSelector() {
  const [open, setOpen] = React.useState(false);
  const [selectedCluster, setSelectedCluster] = React.useState<string>("");
  const [clusters, setClusters] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchClusters() {
      try {
        const response = await fetch('/api/clusters');
        const data = await response.json();
        setClusters(data.clusterIds || []);
        // Set the first cluster as default if none selected
        if (data.clusterIds?.length > 0 && !selectedCluster) {
          setSelectedCluster(data.clusterIds[0]);
        }
      } catch (error) {
        console.error('Failed to fetch clusters:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchClusters();
  }, []);

  const displayValue = loading 
    ? "Loading..." 
    : selectedCluster || "Select cluster...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="w-auto justify-between border-[0.5px] font-semibold bg-[rgb(244,245,246)] text-[rgb(28,29,31)] dark:bg-zinc-800 dark:text-zinc-100"
          disabled={loading}
        >
          {displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Search clusters..." />
          <CommandList>
            <CommandEmpty>No cluster found.</CommandEmpty>
            <CommandGroup heading="Available Clusters">
              {clusters.map((cluster) => (
                <CommandItem
                  key={cluster}
                  value={cluster}
                  onSelect={(value) => {
                    setSelectedCluster(value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCluster === cluster ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {cluster}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function NavigationMenuDemo() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const pathname = usePathname()
  
  const showClusterSelector = !HIDE_CLUSTER_SELECTOR_PATHS.includes(pathname)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex items-center justify-between w-full">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Button variant="ghost" className="h-auto p-2 font-mono">
                <Sheet />
                Tables
              </Button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              <Button variant="ghost" className="h-auto p-2 font-mono">
                some_long_pinot_table_name_REALTIME
              </Button>
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-2 ml-auto">
        {showClusterSelector && <ClusterSelector />}
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

