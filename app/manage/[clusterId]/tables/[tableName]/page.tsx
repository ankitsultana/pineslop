"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Table2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TableConfig {
  offline?: Record<string, unknown>
  realtime?: Record<string, unknown>
  tableName?: string
}

export default function TableDetailPage() {
  const params = useParams()
  const clusterId = params.clusterId as string
  const tableName = params.tableName as string

  const [config, setConfig] = React.useState<TableConfig | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState<string | null>(null)

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
          <a href="/manage" className="hover:underline">Manage</a>
          <span>/</span>
          <a href={`/manage/${clusterId}`} className="hover:underline">{clusterId}</a>
          <span>/</span>
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
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="mb-4">
            {hasRealtime && (
              <TabsTrigger value="realtime">Realtime Config</TabsTrigger>
            )}
            {hasOffline && (
              <TabsTrigger value="offline">Offline Config</TabsTrigger>
            )}
          </TabsList>

          {hasRealtime && (
            <TabsContent value="realtime">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Realtime Configuration</CardTitle>
                    <CardDescription>
                      Configuration for the realtime table
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(JSON.stringify(config.realtime, null, 2), "realtime")}
                  >
                    {copied === "realtime" ? (
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
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] w-full rounded-md border">
                    <pre className="p-4 text-sm font-mono">
                      {JSON.stringify(config.realtime, null, 2)}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {hasOffline && (
            <TabsContent value="offline">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Offline Configuration</CardTitle>
                    <CardDescription>
                      Configuration for the offline table
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(JSON.stringify(config.offline, null, 2), "offline")}
                  >
                    {copied === "offline" ? (
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
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] w-full rounded-md border">
                    <pre className="p-4 text-sm font-mono">
                      {JSON.stringify(config.offline, null, 2)}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  )
}

