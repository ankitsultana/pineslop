import { NextRequest, NextResponse } from 'next/server';
import { getResolvedClusterConfig } from '@/lib/clusters';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clusterId: string; tableName: string; segmentName: string }> }
) {
  const { clusterId, tableName, segmentName } = await params;
  const clusterConfig = getResolvedClusterConfig(clusterId);

  if (!clusterConfig) {
    return NextResponse.json(
      { error: `Cluster '${clusterId}' not found` },
      { status: 404 }
    );
  }

  // Use columns=* to get all column metadata
  const url = `${clusterConfig.url}/segments/${tableName}/${encodeURIComponent(segmentName)}/metadata?columns=*`;

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
    console.error('Error fetching segment metadata from cluster:', error);
    return NextResponse.json(
      { error: 'Failed to fetch segment metadata from cluster' },
      { status: 500 }
    );
  }
}

