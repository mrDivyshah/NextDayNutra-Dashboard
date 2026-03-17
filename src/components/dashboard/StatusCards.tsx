"use client";

import React from "react";

interface StatusCardsProps {
  onTrack: number;
  offTrack: number;
  atRisk: number;
  whiteLabel: number;
}

export function StatusCards({ onTrack, offTrack, atRisk, whiteLabel }: StatusCardsProps) {
  return (
    <div className="status-cards">
      <div className="status-card track">
        <div className="title">On Track</div>
        <div className="count">{onTrack}</div>
      </div>
      <div className="status-card off-track">
        <div className="title">Off Track</div>
        <div className="count">{offTrack}</div>
      </div>
      <div className="status-card risk">
        <div className="title">At Risk</div>
        <div className="count">{atRisk}</div>
      </div>
      <div className="status-card whitelabel">
        <div className="title">White Label Order</div>
        <div className="count">{whiteLabel}</div>
      </div>
    </div>
  );
}
