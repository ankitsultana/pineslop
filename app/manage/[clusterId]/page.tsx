import { Server } from "lucide-react"

interface ManageClusterPageProps {
  params: Promise<{
    clusterId: string
  }>
}

export default async function ManageClusterPage({ params }: ManageClusterPageProps) {
  const { clusterId } = await params

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
      <div className="flex items-center justify-center h-[400px] border border-dashed rounded-lg">
        <p className="text-muted-foreground">Cluster management coming soon...</p>
      </div>
    </div>
  )
}

