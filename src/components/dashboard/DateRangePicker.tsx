"use client";

import React, { useState, useEffect, useRef } from "react";
import { Calendar, ChevronRight } from "lucide-react";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  setStartDate: (d: string) => void;
  setEndDate: (d: string) => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handleDateClick = (d: number, m: number, y: number) => {
    const formatted = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (!startDate || (startDate && endDate)) {
      setStartDate(formatted);
      setEndDate("");
    } else {
      const start = new Date(startDate);
      const clicked = new Date(formatted);
      if (clicked < start) {
        setStartDate(formatted);
        setEndDate(startDate);
      } else {
        setEndDate(formatted);
        setIsOpen(false);
      }
    }
  };

  const renderCalendar = (offset: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    const days = daysInMonth(d);
    const start = firstDayOfMonth(d);
    const monthName = d.toLocaleString("default", { month: "long" });
    const year = d.getFullYear();

    const cells: React.ReactNode[] = [];
    for (let i = 0; i < start; i++) cells.push(<div key={`blank-${i}`} />);
    for (let day = 1; day <= days; day++) {
      const dateStr = `${year}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isStart = startDate === dateStr;
      const isEnd = endDate === dateStr;
      const inRange = startDate && endDate && dateStr > startDate && dateStr < endDate;

      cells.push(
        <div
          key={day}
          onClick={() => handleDateClick(day, d.getMonth(), year)}
          style={{
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: isStart || isEnd ? 700 : 500,
            background: isStart || isEnd ? "#123e67" : inRange ? "#e8eff6" : "transparent",
            color: isStart || isEnd ? "#fff" : inRange ? "#123e67" : "#334155",
          }}
          onMouseEnter={(e) => {
            if (!isStart && !isEnd && !inRange)
              (e.currentTarget as HTMLElement).style.background = "#f1f5f9";
          }}
          onMouseLeave={(e) => {
            if (!isStart && !isEnd && !inRange)
              (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          {day}
        </div>
      );
    }

    return (
      <div style={{ flex: 1, minWidth: 220 }}>
        <div
          style={{ fontSize: 14, fontWeight: 700, color: "#123e67", marginBottom: 12, textAlign: "center" }}
        >
          {monthName} {year}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((w) => (
            <div
              key={w}
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#94a3b8",
                textAlign: "center",
                paddingBottom: 6,
              }}
            >
              {w}
            </div>
          ))}
          {cells}
        </div>
      </div>
    );
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              marginLeft: 4,
            }}
          >
            Start Date
          </label>
          <div
            onClick={() => setIsOpen(true)}
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              height: 34,
              width: 130,
              padding: "0 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              fontSize: 12,
              color: "#334155",
            }}
          >
            {startDate || "dd-mm-yyyy"}
            <Calendar size={14} color="#94a3b8" />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              marginLeft: 4,
            }}
          >
            End Date
          </label>
          <div
            onClick={() => setIsOpen(true)}
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              height: 34,
              width: 130,
              padding: "0 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              fontSize: 12,
              color: "#334155",
            }}
          >
            {endDate || "dd-mm-yyyy"}
            <Calendar size={14} color="#94a3b8" />
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: 10,
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            boxShadow: "0 20px 50px -10px rgba(0,0,0,0.15)",
            zIndex: 100,
            padding: 24,
            width: 500,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <button
              onClick={() =>
                setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
              }
              style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
            >
              <ChevronRight size={18} style={{ transform: "rotate(180deg)" }} />
            </button>
            <button
              onClick={() =>
                setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
              }
              style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 32 }}>
            {renderCalendar(0)}
            {renderCalendar(1)}
          </div>
          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "#123e67",
                color: "#fff",
                border: "none",
                padding: "8px 20px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
