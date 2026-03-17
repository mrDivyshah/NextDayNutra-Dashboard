"use client";

import React from "react";
import { Bell } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  return (
    <div className="dashboard-header">
      <h1>{title}</h1>
      <div className="notification-bell">
        <Bell size={24} />
        <span className="badge">4</span>
      </div>
    </div>
  );
}
