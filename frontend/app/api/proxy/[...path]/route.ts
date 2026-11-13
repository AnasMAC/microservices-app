import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyTokenWithKeycloak } from '@/lib/auth-server';

const GATEWAY_URL = process.env.GATEWAY_INTERNAL_URL || process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8888';

async function handleProxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const targetPath = path.join('/');
  const searchParams = req.nextUrl.search;
  const targetUrl = `${GATEWAY_URL}/${targetPath}${searchParams}`;

  // 1. Catch the token from the cookies
  const cookieStore = await cookies();
  const token = cookieStore.get('kc_token')?.value;

  const headers = new Headers();
  const contentType = req.headers.get('content-type');
  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  // 2. Cryptographically verify the token using Keycloak's public keys via jose
  if (token) {
    const verification = await verifyTokenWithKeycloak(token);
    if (verification.isValid) {
      // Attach verified Bearer token to backend request
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn('Proxy rejected invalid or expired cookie token:', verification.error);
    }
  }

  // 3. Forward request body for mutations (POST, PUT, PATCH)
  let body: BodyInit | undefined = undefined;
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    try {
      body = await req.text();
    } catch {
      // no body
    }
  }

  // 4. Resend request to Spring Cloud Gateway
  try {
    const res = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: 'Backend Gateway Unreachable',
        message: err.message,
        targetUrl,
      },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
