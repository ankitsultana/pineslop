import { NextResponse } from 'next/server';
import { getDatasourcesInfo } from '@/lib/datasources';

export async function GET() {
  const datasources = getDatasourcesInfo();
  return NextResponse.json({ datasources });
}

