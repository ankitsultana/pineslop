"use client"

import * as React from "react"
import Link from "next/link"
import { Server, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ClusterInfo {
  id: string
  url: string
}

export default function ManageClusters() {
  const [clusters, setClusters] = React.useState<ClusterInfo[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchClusters() {
      try {
        const response = await fetch("/api/clusters")
        const data = await response.json()
        // Transform cluster IDs into objects with id
        const clusterInfos = (data.clusterIds || []).map((id: string) => ({ id }))
        setClusters(clusterInfos)
      } catch (error) {
        console.error("Failed to fetch clusters:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchClusters()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading clusters...</p>
      </div>
    )
  }

  if (clusters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Server className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">No clusters configured</p>
        <p className="text-sm text-muted-foreground">
          Add clusters to <code className="bg-muted px-1.5 py-0.5 rounded">config/clusters.json</code>
        </p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Manage Clusters</h1>
        <p className="text-muted-foreground">Select a cluster to manage its resources</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clusters.map((cluster) => (
          <Link key={cluster.id} href={`/manage/${cluster.id}`}>
            <Card className="cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  {cluster.id}
                </CardTitle>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>Click to manage this cluster</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
