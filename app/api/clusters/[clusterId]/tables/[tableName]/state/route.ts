import { NextRequest, NextResponse } from 'next/server';
import { getResolvedClusterConfig } from '@/lib/clusters';

interface TableViewResponse {
  OFFLINE?: Record<string, Record<string, string>>;
  REALTIME?: Record<string, Record<string, string>>;
}

interface StateComparisonResult {
  status: 'GOOD' | 'BAD' | 'UNKNOWN';
  idealState: TableViewResponse;
  externalView: TableViewResponse;
}

function compareStates(idealState: TableViewResponse, externalView: TableViewResponse): 'GOOD' | 'BAD' {
  // Compare OFFLINE segments
  const offlineIdeal = idealState.OFFLINE || {};
  const offlineExternal = externalView.OFFLINE || {};
  
  // Compare REALTIME segments
  const realtimeIdeal = idealState.REALTIME || {};
  const realtimeExternal = externalView.REALTIME || {};

  // Check if all segments in ideal state match external view
  const checkSegments = (ideal: Record<string, Record<string, string>>, external: Record<string, Record<string, string>>) => {
    const idealSegments = Object.keys(ideal);
    const externalSegments = Object.keys(external);

    // Check if same segments exist
    if (idealSegments.length !== externalSegments.length) {
      return false;
    }

    for (const segment of idealSegments) {
      if (!external[segment]) {
        return false;
      }

      const idealReplicas = ideal[segment];
      const externalReplicas = external[segment];

      // Check each replica's state
      for (const [replica, idealStatus] of Object.entries(idealReplicas)) {
        const externalStatus = externalReplicas[replica];
        if (externalStatus !== idealStatus) {
          return false;
        }
      }
    }

    return true;
  };

  const offlineMatch = checkSegments(offlineIdeal, offlineExternal);
  const realtimeMatch = checkSegments(realtimeIdeal, realtimeExternal);

  return offlineMatch && realtimeMatch ? 'GOOD' : 'BAD';
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

  const idealStateUrl = `${clusterConfig.url}/tables/${tableName}/idealstate`;
  const externalViewUrl = `${clusterConfig.url}/tables/${tableName}/externalview`;

  try {
    const [idealStateResponse, externalViewResponse] = await Promise.all([
      fetch(idealStateUrl, { headers: clusterConfig.headers }),
      fetch(externalViewUrl, { headers: clusterConfig.headers }),
    ]);

    if (!idealStateResponse.ok || !externalViewResponse.ok) {
      return NextResponse.json(
        { 
          error: `Cluster API error: ideal=${idealStateResponse.statusText}, external=${externalViewResponse.statusText}` 
        },
        { status: idealStateResponse.ok ? externalViewResponse.status : idealStateResponse.status }
      );
    }

    const idealState: TableViewResponse = await idealStateResponse.json();
    const externalView: TableViewResponse = await externalViewResponse.json();

    const status = compareStates(idealState, externalView);

    const result: StateComparisonResult = {
      status,
      idealState,
      externalView,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching table state from cluster:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table state from cluster' },
      { status: 500 }
    );
  }
}

