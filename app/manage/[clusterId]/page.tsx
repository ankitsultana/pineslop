"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Server, Table2, ChevronRight, Loader2, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ClusterStats {
  tableCount: number | null
  serverTenantCount: number | null
  brokerTenantCount: number | null
  loading: boolean
  error: string | null
}

export default function ManageClusterPage() {
  const params = useParams()
  const clusterId = params.clusterId as string
  
  const [stats, setStats] = React.useState<ClusterStats>({
    tableCount: null,
    serverTenantCount: null,
    brokerTenantCount: null,
    loading: true,
    error: null,
  })

  React.useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch tables and tenants in parallel
        const [tablesResponse, tenantsResponse] = await Promise.all([
          fetch(`/api/clusters/${clusterId}/tables`),
          fetch(`/api/clusters/${clusterId}/tenants`),
        ])

        if (!tablesResponse.ok || !tenantsResponse.ok) {
          throw new Error('Failed to fetch cluster data')
        }

        const [tablesData, tenantsData] = await Promise.all([
          tablesResponse.json(),
          tenantsResponse.json(),
        ])

        setStats({
          tableCount: tablesData.tables?.length ?? 0,
          serverTenantCount: tenantsData.SERVER_TENANTS?.length ?? 0,
          brokerTenantCount: tenantsData.BROKER_TENANTS?.length ?? 0,
          loading: false,
          error: null,
        })
      } catch (error) {
        console.error('Error fetching cluster stats:', error)
        setStats({
          tableCount: null,
          serverTenantCount: null,
          brokerTenantCount: null,
          loading: false,
          error: 'Failed to connect to cluster',
        })
      }
    }
    fetchStats()
  }, [clusterId])

  const totalTenants = (stats.serverTenantCount ?? 0) + (stats.brokerTenantCount ?? 0)

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
          <a href="/manage" className="hover:underline">Manage</a>
          <span>/</span>
          <span>{clusterId}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Server className="h-6 w-6" />
          {clusterId}
        </h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Tables Card */}
        <Link href={`/manage/${clusterId}/tables`}>
          <Card className="cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Table2 className="h-4 w-4 text-muted-foreground" />
                Tables
              </CardTitle>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stats.loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : stats.error ? (
                <CardDescription className="text-destructive">{stats.error}</CardDescription>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.tableCount}</div>
                  <CardDescription>
                    {stats.tableCount === 1 ? 'table' : 'tables'} in this cluster
                  </CardDescription>
                </>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Tenants Card */}
        <Link href={`/manage/${clusterId}/tenants`}>
          <Card className="cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Tenants
              </CardTitle>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stats.loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : stats.error ? (
                <CardDescription className="text-destructive">{stats.error}</CardDescription>
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalTenants}</div>
                  <CardDescription>
                    {stats.serverTenantCount} server, {stats.brokerTenantCount} broker
                  </CardDescription>
                </>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
