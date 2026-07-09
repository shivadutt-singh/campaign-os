import datetime
from typing import Any, Dict, List, Optional
import uuid
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
import numpy as np
import pandas as pd

from app.models.models import CampaignMetrics, FeatureStore


class FeatureStoreService:
    """
    Computes, caches, and registers real-time and rolling features for campaign models.
    """

    @staticmethod
    async def compute_and_store_features(db: AsyncSession, campaign_id: uuid.UUID) -> int:
        """
        Loads historical metrics for the campaign, computes CTR, CPC, CPA, ROAS,
        rolling averages, and trends, and stores them in the feature store.
        """
        # Load all metrics for this campaign
        query = (
            select(CampaignMetrics)
            .where(CampaignMetrics.campaign_id == campaign_id)
            .order_by(CampaignMetrics.date.asc())
        )
        res = await db.execute(query)
        metrics = res.scalars().all()

        if not metrics:
            return 0

        # Build Pandas DataFrame for easy sequence analysis
        data = []
        for m in metrics:
            data.append({
                "date": pd.to_datetime(m.date),
                "spend": float(m.spend),
                "revenue": float(m.revenue),
                "clicks": float(m.clicks) if m.clicks else 0.0,
                "impressions": float(m.impressions) if m.impressions else 0.0,
                "conversions": float(m.conversions) if m.conversions else 0.0
            })

        df = pd.DataFrame(data)
        # Aggregate by date to get daily metrics if multiple entries exist per date
        df = df.groupby("date").sum().reset_index()
        df = df.sort_values("date")

        # 1. Core Ratios
        df["ctr"] = np.where(df["impressions"] > 0, df["clicks"] / df["impressions"], 0.0)
        df["cpc"] = np.where(df["clicks"] > 0, df["spend"] / df["clicks"], 0.0)
        df["cpa"] = np.where(df["conversions"] > 0, df["spend"] / df["conversions"], 0.0)
        df["roas"] = np.where(df["spend"] > 0, df["revenue"] / df["spend"], 0.0)

        # 2. Moving Averages
        df["moving_average_7d"] = df["spend"].rolling(window=7, min_periods=1).mean()
        df["moving_average_30d"] = df["spend"].rolling(window=30, min_periods=1).mean()

        # 3. Trend & Seasonality Decomposition
        # Simple additive decomposition: Trend is 7-day rolling average
        df["trend"] = df["revenue"].rolling(window=7, min_periods=1).mean()
        df["seasonality"] = np.where(df["trend"] > 0, df["revenue"] / df["trend"], 1.0)

        # Daily and weekly gradients (pct change)
        df["daily_trend"] = df["revenue"].pct_change(fill_method=None).fillna(0.0)
        df["weekly_trend"] = df["revenue"].pct_change(periods=7, fill_method=None).fillna(0.0)

        stored_count = 0
        for _, row in df.iterrows():
            row_date = row["date"].to_pydatetime().date()
            
            # Check if feature row already exists to prevent duplicate key records
            chk_query = select(FeatureStore).where(
                and_(
                    FeatureStore.campaign_id == campaign_id,
                    FeatureStore.date == row_date
                )
            )
            chk_res = await db.execute(chk_query)
            existing = chk_res.scalars().first()

            if existing:
                # Update existing
                existing.ctr = float(row["ctr"])
                existing.cpc = float(row["cpc"])
                existing.cpa = float(row["cpa"])
                existing.roas = float(row["roas"])
                existing.moving_average_7d = float(row["moving_average_7d"])
                existing.moving_average_30d = float(row["moving_average_30d"])
                existing.weekly_trend = float(row["weekly_trend"])
                existing.daily_trend = float(row["daily_trend"])
                existing.seasonality = float(row["seasonality"])
            else:
                # Create new
                f_entry = FeatureStore(
                    campaign_id=campaign_id,
                    date=row_date,
                    ctr=float(row["ctr"]),
                    cpc=float(row["cpc"]),
                    cpa=float(row["cpa"]),
                    roas=float(row["roas"]),
                    moving_average_7d=float(row["moving_average_7d"]),
                    moving_average_30d=float(row["moving_average_30d"]),
                    weekly_trend=float(row["weekly_trend"]),
                    daily_trend=float(row["daily_trend"]),
                    seasonality=float(row["seasonality"])
                )
                db.add(f_entry)
            stored_count += 1

        await db.commit()
        return stored_count

    @staticmethod
    async def get_features(db: AsyncSession, campaign_id: uuid.UUID, limit: int = 30) -> List[Dict[str, Any]]:
        """
        Retrieves the latest features for campaign models.
        """
        query = (
            select(FeatureStore)
            .where(FeatureStore.campaign_id == campaign_id)
            .order_by(FeatureStore.date.desc())
            .limit(limit)
        )
        res = await db.execute(query)
        features = res.scalars().all()

        return [
            {
                "date": str(f.date),
                "ctr": f.ctr,
                "cpc": f.cpc,
                "cpa": f.cpa,
                "roas": f.roas,
                "moving_average_7d": f.moving_average_7d,
                "moving_average_30d": f.moving_average_30d,
                "weekly_trend": f.weekly_trend,
                "daily_trend": f.daily_trend,
                "seasonality": f.seasonality
            }
            for f in features
        ]
