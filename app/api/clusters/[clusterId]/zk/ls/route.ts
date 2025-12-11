import { NextRequest, NextResponse } from 'next/server';
import { getResolvedClusterConfig } from '@/lib/clusters';

interface ZkLsResponse {
  children: string[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clusterId: string }> }
) {
  const { clusterId } = await params;
  const clusterConfig = getResolvedClusterConfig(clusterId);

  if (!clusterConfig) {
    return NextResponse.json(
      { error: `Cluster '${clusterId}' not found` },
      { status: 404 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path') || '/';

  const url = `${clusterConfig.url}/zk/ls?path=${encodeURIComponent(path)}`;

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

    // The Pinot API returns an array of child names directly
    const data = await response.json();
    
    // Normalize to always return an array
    const children = Array.isArray(data) ? data : [];
    
    return NextResponse.json({ children } as ZkLsResponse);
  } catch (error) {
    console.error('Error fetching ZK children from cluster:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ZK children from cluster' },
      { status: 500 }
    );
  }
}
