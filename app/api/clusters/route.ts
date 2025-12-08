import { NextResponse } from 'next/server';
import { getClusterIds } from '@/lib/clusters';

export async function GET() {
  const clusterIds = getClusterIds();
  return NextResponse.json({ clusterIds });
}

