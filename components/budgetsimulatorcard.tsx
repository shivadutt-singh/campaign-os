"use client";

import { useState } from "react";

export default function BudgetSimulatorCard() {
  const [budget, setBudget] = useState(50000);
  const [duration, setDuration] = useState(6);
  const [growth, setGrowth] = useState(15);

  return (
    <div className="bg-[#111111] border border-[#333333] rounded-xl p-6 text-white">
      <h2 className="text-2xl font-bold mb-6">
        Budget Simulator
      </h2>

      <div className="mb-6">
        <label>Media Budget: ₹{budget}</label>
        <input
          type="range"
          min="10000"
          max="100000"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="mb-6">
        <label>Campaign Duration: {duration} Months</label>
        <input
          type="range"
          min="1"
          max="12"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label>Expected Growth: {growth}%</label>
        <input
          type="range"
          min="0"
          max="50"
          value={growth}
          onChange={(e) => setGrowth(Number(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
}