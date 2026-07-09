import { NextResponse } from 'next/server';

/**
 * POST /api/campaigns/save
 * Forwards campaign session saves to Python backend at http://localhost:8000/api/v1/campaigns/save
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const pythonBackendUrl = 'http://localhost:8000/api/v1/campaigns/save';
    const response = await fetch(pythonBackendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: 'Backend failed to save campaign session', details: errorText }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API /api/campaigns/save handler exception:', error);
    return NextResponse.json({ error: 'Failed to save campaign', details: error.message || String(error) }, { status: 500 });
  }
}
