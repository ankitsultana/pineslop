import { NextRequest, NextResponse } from 'next/server';
import { getResolvedClusterConfig } from '@/lib/clusters';

interface TableSizeResponse {
  tableName: string;
  reportedSizeInBytes: number;
  estimatedSizeInBytes: number;
}

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

  const url = `${clusterConfig.url}/tables/${tableName}/size?verbose=false&includeReplacedSegments=false`;

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

    const data: TableSizeResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching table size from cluster:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table size from cluster' },
      { status: 500 }
    );
  }
}

