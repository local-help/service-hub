import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'http://backend:3000' : 'http://localhost:3000');

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const subPath = resolvedParams.path.join('/');
  const search = req.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/api/v1/${subPath}${search}`;

  const forwardHeaders = new Headers(req.headers);
  forwardHeaders.delete('host');
  forwardHeaders.delete('connection');
  forwardHeaders.delete('content-length');

  const options: RequestInit = {
    method: req.method,
    headers: forwardHeaders,
    redirect: 'manual',
  };

  if (!['GET', 'HEAD'].includes(req.method)) {
    const body = await req.arrayBuffer();
    options.body = body;
  }

  try {
    const res = await fetch(targetUrl, options);
    const resHeaders = new Headers(res.headers);
    resHeaders.delete('content-encoding');
    resHeaders.delete('content-length');

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
    });
  } catch (error: any) {
    console.error(`[API Proxy Error] Failed to proxy to ${targetUrl}:`, error.message);
    return NextResponse.json(
      { error: 'Backend server unavailable', detail: error.message },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
export const OPTIONS = handler;

