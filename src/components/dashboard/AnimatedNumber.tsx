"use client";

import React, { useEffect, useRef, useState } from "react";

type AnimatedNumberProps = {
  value: number;
  durationMs?: number;
  prefix?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - progress, 3);
}

export function AnimatedNumber({
  value,
  durationMs = 700,
  prefix = "",
  minimumFractionDigits = 0,
  maximumFractionDigits = 2,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);

  useEffect(() => {
    const startValue = previousValueRef.current;
    const targetValue = value;

    if (startValue === targetValue) return;

    let animationFrame = 0;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeOutCubic(progress);
      const nextValue = startValue + (targetValue - startValue) * eased;

      setDisplayValue(nextValue);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate);
      } else {
        previousValueRef.current = targetValue;
      }
    };

    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      previousValueRef.current = targetValue;
    };
  }, [durationMs, value]);

  return (
    <>
      {prefix}
      {displayValue.toLocaleString("en-US", {
        minimumFractionDigits,
        maximumFractionDigits,
      })}
    </>
  );
}
