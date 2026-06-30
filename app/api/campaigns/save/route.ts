import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { budgets, projectedRevenue, roi } = await request.json();

    const savedCampaign = await prisma.campaignSession.create({
      data: {
        budgetPayload: JSON.stringify(budgets),
        projectedRevenue: parseFloat(projectedRevenue),
        roi: parseFloat(roi),
      },
    });

    return NextResponse.json({ success: true, id: savedCampaign.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save campaign' }, { status: 500 });
  }
}