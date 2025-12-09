"use client"

import { DatasourceSelector } from "@/components/datasource-selector"

export default function Visualize() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-4">
        <DatasourceSelector />
      </div>
      <div className="flex-1">
        <p className="text-muted-foreground">Visualize - Select a datasource to get started</p>
      </div>
    </div>
  )
}
