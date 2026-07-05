import { NextResponse } from 'next/server';

/**
 * POST /api/optimize
 * Forwards optimization request to Python backend at http://localhost:8000/optimize
 * Features a 15-second AbortController timeout mechanism.
 */
export async function POST(request: Request) {
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    // 1. Extract and validate targetRevenue from incoming JSON payload
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const { targetRevenue } = body;

    // Check if targetRevenue is missing or invalid
    if (targetRevenue === undefined || targetRevenue === null || typeof targetRevenue !== 'number') {
      return NextResponse.json(
        { error: 'Missing or invalid targetRevenue in request body. It must be a number.' },
        { status: 400 }
      );
    }

    // 2. Set up AbortController for a robust 15-second timeout mechanism
    const controller = new AbortController();
    timeoutId = setTimeout(() => {
      controller.abort();
    }, 15000);

    // 3. Forward payload to Python predictive engine
    const pythonBackendUrl = 'http://localhost:8000/optimize';
    
    let response: Response;
    try {
      response = await fetch(pythonBackendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetRevenue }),
        signal: controller.signal,
      });
    } finally {
      // Clear timeout immediately after the request completes or is aborted
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    // 4. Handle Python server errors
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { 
          error: 'Optimization engine returned an error', 
          status: response.status,
          details: errorText 
        },
        { status: response.status || 500 }
      );
    }

    // 5. Parse and return the successful JSON response exactly as received from Python
    const result = await response.json();
    return NextResponse.json(result);

  } catch (error: any) {
    // 6. Handle timeout (AbortError) vs standard errors
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Gateway Timeout: The optimization engine took longer than 15 seconds to respond.' },
        { status: 504 }
      );
    }

    console.error('API /api/optimize handler exception:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        details: error.message || String(error) 
      },
      { status: 500 }
    );
  }
}
