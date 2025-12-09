"use client"

import * as React from "react"
import {
  Database,
  Server,
  Network,
  ChevronsUpDown,
  Check,
  type LucideIcon,
} from "lucide-react"

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

// Map icon names to lucide components
const iconMap: Record<string, LucideIcon> = {
  database: Database,
  server: Server,
  network: Network,
}

interface DatasourceInfo {
  id: string
  type: "cluster" | "federated"
  icon: string
}

interface DatasourceSelectorProps {
  className?: string
}

export function DatasourceSelector({ className }: DatasourceSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDatasource, setSelectedDatasource] = React.useState<string>("")
  const [datasources, setDatasources] = React.useState<DatasourceInfo[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchDatasources() {
      try {
        const response = await fetch("/api/datasources")
        const data = await response.json()
        setDatasources(data.datasources || [])
        // Set the first datasource as default if none selected
        if (data.datasources?.length > 0 && !selectedDatasource) {
          setSelectedDatasource(data.datasources[0].id)
        }
      } catch (error) {
        console.error("Failed to fetch datasources:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDatasources()
  }, [])

  const selectedInfo = datasources.find((ds) => ds.id === selectedDatasource)
  const SelectedIcon = selectedInfo ? iconMap[selectedInfo.icon] || Database : Database

  const displayValue = loading
    ? "Loading..."
    : selectedDatasource || "Select datasource..."

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[240px] justify-between", className)}
          disabled={loading}
        >
          <span className="flex items-center gap-2">
            {!loading && <SelectedIcon className="h-4 w-4 text-muted-foreground" />}
            <span className="truncate">{displayValue}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search datasources..." />
          <CommandList>
            <CommandEmpty>No datasource found.</CommandEmpty>
            <CommandGroup heading="Datasources">
              {datasources.map((ds) => {
                const Icon = iconMap[ds.icon] || Database
                return (
                  <CommandItem
                    key={ds.id}
                    value={ds.id}
                    onSelect={(value) => {
                      setSelectedDatasource(value)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedDatasource === ds.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{ds.id}</span>
                    <span className="ml-2 text-xs text-muted-foreground capitalize">
                      {ds.type}
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

