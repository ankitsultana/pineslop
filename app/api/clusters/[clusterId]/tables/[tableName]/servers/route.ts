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

  const searchParams = request.nextUrl.searchParams;
  const tableType = searchParams.get('type');
  const verbose = searchParams.get('verbose');

  const queryParams = new URLSearchParams();
  if (tableType) queryParams.set('type', tableType);
  if (verbose !== null) queryParams.set('verbose', verbose);

  const queryString = queryParams.toString();
  const url = `${clusterConfig.url}/segments/${tableName}/servers${queryString ? `?${queryString}` : ''}`;

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
    console.error('Error fetching server segments from cluster:', error);
    return NextResponse.json(
      { error: 'Failed to fetch server segments from cluster' },
      { status: 500 }
    );
  }
}

