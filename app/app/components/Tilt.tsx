"use client";

import { useRef } from "react";

export default function Tilt({
  children,
  className = "",
  style,
  maxTilt = 10,
  glow = true,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  maxTilt?: number;
  glow?: boolean;
}) {
  const elRef = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = elRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1
    const rotateY = (px - 0.5) * maxTilt * 2;
    const rotateX = (0.5 - py) * maxTilt * 2;
    el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
    if (glow) {
      el.style.boxShadow = `${-rotateY * 1.5}px ${rotateX * 1.5}px 40px rgba(3, 4, 94, 0.15)`;
    }
  }

  function onLeave() {
    const el = elRef.current;
    if (!el) return;
    el.style.transform = "rotateX(0deg) rotateY(0deg) translateZ(0)";
    el.style.boxShadow = "0 10px 30px rgba(3, 4, 94, 0.06)";
  }

  return (
    <div className={`tilt-wrap ${className}`} style={style}>
      <div ref={elRef} className="tilt-el" onMouseMove={onMove} onMouseLeave={onLeave}>
        {children}
      </div>
    </div>
  );
}
