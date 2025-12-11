import { NextRequest, NextResponse } from 'next/server';
import { getResolvedClusterConfig } from '@/lib/clusters';

export interface ZkStat {
  czxid?: number;
  mzxid?: number;
  ctime?: number;
  mtime?: number;
  version?: number;
  cversion?: number;
  aversion?: number;
  ephemeralOwner?: number;
  dataLength?: number;
  numChildren?: number;
  pzxid?: number;
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

  const url = `${clusterConfig.url}/zk/stat?path=${encodeURIComponent(path)}`;

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

    const data: ZkStat = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching ZK stat from cluster:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ZK stat from cluster' },
      { status: 500 }
    );
  }
}
