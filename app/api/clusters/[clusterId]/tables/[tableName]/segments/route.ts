import { NextRequest, NextResponse } from 'next/server';
import { getResolvedClusterConfig } from '@/lib/clusters';

interface SegmentsResponse {
  OFFLINE?: string[];
  REALTIME?: string[];
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

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');

  const queryParams = new URLSearchParams();
  if (type) queryParams.set('type', type);

  const queryString = queryParams.toString();
  const url = `${clusterConfig.url}/segments/${tableName}${queryString ? `?${queryString}` : ''}`;

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

    const data: SegmentsResponse[] = await response.json();
    
    // The API returns an array with one object containing OFFLINE and/or REALTIME arrays
    const result = data[0] || {};
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching segments from cluster:', error);
    return NextResponse.json(
      { error: 'Failed to fetch segments from cluster' },
      { status: 500 }
    );
  }
}

