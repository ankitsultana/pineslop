import { NextRequest, NextResponse } from 'next/server';
import { getResolvedClusterConfig } from '@/lib/clusters';

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

  const url = `${clusterConfig.url}/zk/get?path=${encodeURIComponent(path)}`;

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

    // The content could be text or JSON, return as text to preserve format
    const text = await response.text();
    
    return NextResponse.json({ content: text });
  } catch (error) {
    console.error('Error fetching ZK content from cluster:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ZK content from cluster' },
      { status: 500 }
    );
  }
}
