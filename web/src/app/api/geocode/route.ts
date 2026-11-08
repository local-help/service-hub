import { NextRequest, NextResponse } from 'next/server';

interface CacheEntry {
  data: any;
  timestamp: number;
}

const geoCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get('lat');
  const lonStr = searchParams.get('lon');

  if (!latStr || !lonStr) {
    return NextResponse.json({ error: 'lat and lon parameters are required' }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  // Quantize coordinates to ~100m (~3 decimal places) to maximize cache hits
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = geoCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
        'X-Cache': 'HIT',
      },
    });
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const res = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 LocalHelpApp/1.0',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream geocoding failed' }, { status: res.status });
    }

    const data = await res.json();
    geoCache.set(cacheKey, { data, timestamp: Date.now() });

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
        'X-Cache': 'MISS',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Geocoding request failed' },
      { status: 500 }
    );
  }
}
