"use client";

import React, { useRef, useEffect } from "react";

interface Sunflower {
  relX: number;
  heightRatio: number;
  headRadius: number;
  petalCount: number;
  swaySpeed: number;
  phase: number;
  maxAngle: number;
  depth: number;
  headTilt: number;
  curveFactor: number;
}

export function SunflowerCanvas({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let isIntersecting = true;
    let width = 1;
    let height = 1;

    // Generate field of 32 varied sunflowers
    const sunflowers: Sunflower[] = [];
    const count = 34;
    for (let i = 0; i < count; i++) {
      const relX = (i + (Math.random() * 0.7 - 0.35)) / count;
      sunflowers.push({
        relX,
        heightRatio: 0.65 + Math.random() * 0.32, // Stalk height relative to container
        headRadius: 13 + Math.random() * 8,
        petalCount: 13 + Math.floor(Math.random() * 4),
        swaySpeed: 1.1 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        maxAngle: 0.08 + Math.random() * 0.09,
        depth: 0.5 + Math.random() * 0.5,
        headTilt: -0.15 + Math.random() * 0.3,
        curveFactor: -0.1 + Math.random() * 0.2,
      });
    }

    // Sort by depth so closer plants render over distant ones
    sunflowers.sort((a, b) => a.depth - b.depth);

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawSunflower = (sf: Sunflower, time: number) => {
      const baseX = sf.relX * width;
      const baseY = height + 10;
      const stalkH = height * sf.heightRatio;

      // Harmonic sway oscillation with secondary harmonic breeze
      const wind1 = Math.sin(time * sf.swaySpeed + sf.phase) * sf.maxAngle;
      const wind2 = Math.sin(time * 0.65 + sf.phase * 1.5) * (sf.maxAngle * 0.35);
      const totalSway = wind1 + wind2 + sf.curveFactor;

      // Calculate tip position using bend
      const tipX = baseX + Math.sin(totalSway) * stalkH;
      const tipY = baseY - Math.cos(totalSway) * stalkH;

      // Midpoint control for curved stalk
      const midSway = totalSway * 0.5;
      const midX = baseX + Math.sin(midSway) * (stalkH * 0.52);
      const midY = baseY - Math.cos(midSway) * (stalkH * 0.52);

      const alpha = 0.4 + sf.depth * 0.3; // 40% - 70% subtle dark-aesthetic opacity

      // 1. Stalk
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.quadraticCurveTo(midX, midY, tipX, tipY);
      ctx.lineWidth = 2.5 * sf.depth;
      ctx.strokeStyle = `rgba(50, 85, 58, ${alpha * 0.9})`;
      ctx.stroke();

      // 2. Leaves along stem
      const leafCount = 2;
      for (let l = 1; l <= leafCount; l++) {
        const t = l === 1 ? 0.38 : 0.68;
        const leafBaseX = baseX + (midX - baseX) * t * 1.5;
        const leafBaseY = baseY - (baseY - tipY) * t;
        const dir = l % 2 === 0 ? 1 : -1;
        const leafSway = Math.sin(time * sf.swaySpeed + sf.phase + l) * 0.15;
        const leafEndX = leafBaseX + (dir * 18 + leafSway * 10) * sf.depth;
        const leafEndY = leafBaseY - 6 * sf.depth;

        ctx.beginPath();
        ctx.moveTo(leafBaseX, leafBaseY);
        ctx.quadraticCurveTo(
          leafBaseX + dir * 10 * sf.depth,
          leafBaseY - 12 * sf.depth,
          leafEndX,
          leafEndY
        );
        ctx.quadraticCurveTo(
          leafBaseX + dir * 10 * sf.depth,
          leafBaseY + 4 * sf.depth,
          leafBaseX,
          leafBaseY
        );
        ctx.fillStyle = `rgba(45, 78, 52, ${alpha * 0.75})`;
        ctx.fill();
      }

      // 3. Flower Head
      ctx.save();
      ctx.translate(tipX, tipY);
      ctx.rotate(totalSway + sf.headTilt);

      const radius = sf.headRadius * sf.depth;
      const petalLength = radius * 1.35;
      const petalWidth = radius * 0.38;

      // Radial Petals (Subtle golden amber, harmony with dark backdrop)
      for (let p = 0; p < sf.petalCount; p++) {
        const petalAngle = (p / sf.petalCount) * Math.PI * 2;
        ctx.save();
        ctx.rotate(petalAngle);

        ctx.beginPath();
        ctx.moveTo(0, radius * 0.6);
        ctx.quadraticCurveTo(petalWidth, radius + petalLength * 0.5, 0, radius + petalLength);
        ctx.quadraticCurveTo(-petalWidth, radius + petalLength * 0.5, 0, radius * 0.6);
        ctx.fillStyle = `rgba(240, 185, 45, ${alpha * 0.78})`;
        ctx.fill();

        ctx.restore();
      }

      // Center Seed Disc (Deep bronze charcoal)
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.75, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(32, 22, 14, ${alpha * 1.1})`;
      ctx.fill();

      // Subtle disc border highlight
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(180, 130, 40, ${alpha * 0.4})`;
      ctx.stroke();

      ctx.restore();
    };

    const loop = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const tSec = time * 0.001;
      for (const sf of sunflowers) {
        drawSunflower(sf, tSec);
      }

      animId = isIntersecting && !document.hidden ? requestAnimationFrame(loop) : 0;
    };

    const resizeObserver = new ResizeObserver(handleResize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isIntersecting = entry?.isIntersecting ?? true;
      if (isIntersecting && !animId) {
        animId = requestAnimationFrame(loop);
      } else if (!isIntersecting && animId) {
        cancelAnimationFrame(animId);
        animId = 0;
      }
    });

    const handleVisibility = () => {
      if (document.hidden && animId) {
        cancelAnimationFrame(animId);
        animId = 0;
      } else if (!document.hidden && isIntersecting && !animId) {
        animId = requestAnimationFrame(loop);
      }
    };

    resizeObserver.observe(container);
    intersectionObserver.observe(container);
    document.addEventListener("visibilitychange", handleVisibility);

    handleResize();
    animId = requestAnimationFrame(loop);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <div ref={containerRef} className={`w-full h-full relative ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Soft bottom gradient fade to seamlessly dissolve stalk bases */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent z-10" />
    </div>
  );
}
