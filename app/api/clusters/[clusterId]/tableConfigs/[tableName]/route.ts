import { NextRequest, NextResponse } from 'next/server';
import { getResolvedClusterConfig } from '@/lib/clusters';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clusterId: string; tableName: string }> }
) {
  const { clusterId, tableName } = await params;
  const clusterConfig = getResolvedClusterConfig(clusterId);

  if (!clusterConfig) {
    return NextResponse.json(
      { error: `Cluster '${clusterId}' not found` },
      { status: 404 }
    );
  }

  const url = `${clusterConfig.url}/tableConfigs/${encodeURIComponent(tableName)}`;

  try {
    const response = await fetch(url, {
      headers: clusterConfig.headers,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Cluster API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching table config from cluster:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table config from cluster' },
      { status: 500 }
    );
  }
}

