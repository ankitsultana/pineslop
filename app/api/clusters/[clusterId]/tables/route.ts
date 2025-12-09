import { NextRequest, NextResponse } from 'next/server';
import { getResolvedClusterConfig } from '@/lib/clusters';

interface TablesResponse {
  tables: string[];
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
  const type = searchParams.get('type');
  const sortType = searchParams.get('sortType');
  const sortAsc = searchParams.get('sortAsc');

  // Build query string for the cluster API
  const queryParams = new URLSearchParams();
  if (type) queryParams.set('type', type);
  if (sortType) queryParams.set('sortType', sortType);
  if (sortAsc) queryParams.set('sortAsc', sortAsc);

  const queryString = queryParams.toString();
  const url = `${clusterConfig.url}/tables${queryString ? `?${queryString}` : ''}`;

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

    const data: TablesResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching tables from cluster:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tables from cluster' },
      { status: 500 }
    );
  }
}

