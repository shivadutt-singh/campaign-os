import { NextResponse } from 'next/server';

/**
 * POST /api/simulate
 * Forwards budget simulation requests to Python backend at http://localhost:8000/api/v1/simulate/
 */
export async function POST(request: Request) {
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Set up AbortController for a robust 15-second timeout mechanism
    const controller = new AbortController();
    timeoutId = setTimeout(() => {
      controller.abort();
    }, 15000);

    const pythonBackendUrl = 'http://localhost:8000/api/v1/simulate';
    
    let response: Response;
    try {
      response = await fetch(pythonBackendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { 
          error: 'Simulation engine returned an error', 
          status: response.status,
          details: errorText 
        },
        { status: response.status || 500 }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Gateway Timeout: The simulation engine took longer than 15 seconds to respond.' },
        { status: 504 }
      );
    }

    console.error('API /api/simulate handler exception:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        details: error.message || String(error) 
      },
      { status: 500 }
    );
  }
}
