"use client";

import React, { useRef, useEffect } from "react";

interface Pigeon {
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  opacity: number;
  wingPhase: number;
  flapFrequency: number;
  glideTimer: number;
  isGliding: boolean;
  glideDuration: number;
  flapDuration: number;
}

export function FlyingPigeonsCanvas({ className = "" }: { className?: string }) {
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
    let lastTime = performance.now();

    // Spawn 5-6 pigeons with varied depths, speeds, and scales
    const pigeons: Pigeon[] = [
      {
        x: 0.1,
        y: 0.75,
        vx: 45,
        vy: -18,
        scale: 0.75,
        opacity: 0.55,
        wingPhase: 0,
        flapFrequency: 7.2,
        glideTimer: 0,
        isGliding: false,
        glideDuration: 1.8,
        flapDuration: 2.2,
      },
      {
        x: 0.25,
        y: 0.45,
        vx: 38,
        vy: -12,
        scale: 0.6,
        opacity: 0.45,
        wingPhase: 1.5,
        flapFrequency: 8.0,
        glideTimer: 0.5,
        isGliding: true,
        glideDuration: 2.4,
        flapDuration: 1.9,
      },
      {
        x: -0.05,
        y: 0.6,
        vx: 52,
        vy: -15,
        scale: 0.85,
        opacity: 0.62,
        wingPhase: 3.2,
        flapFrequency: 6.8,
        glideTimer: 1.1,
        isGliding: false,
        glideDuration: 1.6,
        flapDuration: 2.6,
      },
      {
        x: 0.55,
        y: 0.3,
        vx: 32,
        vy: -10,
        scale: 0.5,
        opacity: 0.38,
        wingPhase: 4.0,
        flapFrequency: 8.5,
        glideTimer: 0.8,
        isGliding: false,
        glideDuration: 2.0,
        flapDuration: 2.0,
      },
      {
        x: 0.7,
        y: 0.7,
        vx: 42,
        vy: -14,
        scale: 0.68,
        opacity: 0.5,
        wingPhase: 2.1,
        flapFrequency: 7.5,
        glideTimer: 1.4,
        isGliding: true,
        glideDuration: 2.2,
        flapDuration: 2.1,
      },
      {
        x: 0.4,
        y: 0.85,
        vx: 48,
        vy: -16,
        scale: 0.72,
        opacity: 0.48,
        wingPhase: 5.1,
        flapFrequency: 7.0,
        glideTimer: 0.2,
        isGliding: false,
        glideDuration: 1.7,
        flapDuration: 2.4,
      },
    ];

    let initialized = false;

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Initialize pixel coordinates on first resize
      if (!initialized) {
        for (const p of pigeons) {
          p.x = p.x * width;
          p.y = p.y * height;
        }
        initialized = true;
      }
    };

    const drawPigeon = (p: Pigeon) => {
      ctx.save();
      ctx.translate(p.x, p.y);

      // Rotate in flight direction with slight gentle climb
      const heading = Math.atan2(p.vy, p.vx);
      ctx.rotate(heading);
      ctx.scale(p.scale, p.scale);

      ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;

      // Wing flap value: -1 (down) to +1 (up)
      // When gliding, wings stay slightly elevated in a graceful dihedral position
      const wingFlap = p.isGliding
        ? 0.35 + Math.sin(p.wingPhase * 0.5) * 0.08
        : Math.sin(p.wingPhase);

      // 1. Sleek Tail Feathers
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(-24, -3.5);
      ctx.lineTo(-27, 0);
      ctx.lineTo(-24, 3.5);
      ctx.closePath();
      ctx.fill();

      // 2. Torso, Neck & Beak
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.quadraticCurveTo(-6, 3.5, 6, 2.5);
      ctx.quadraticCurveTo(13, 1.5, 17, -0.5); // Beak tip
      ctx.quadraticCurveTo(12, -2.5, 7, -2);   // Crown/head
      ctx.quadraticCurveTo(0, -3.5, -15, 0);   // Upper back
      ctx.closePath();
      ctx.fill();

      // 3. Far Wing (Upward/Backwards sweep)
      const farSpan = 22 * (0.6 + 0.45 * wingFlap);
      ctx.beginPath();
      ctx.moveTo(-2, -1.5);
      ctx.bezierCurveTo(4, -8, 8, -farSpan * 0.7, -3, -farSpan);
      ctx.bezierCurveTo(-10, -farSpan * 0.8, -11, -8, -8, -1.5);
      ctx.closePath();
      ctx.fill();

      // 4. Near Wing (Foreground sweep)
      const nearSpan = 18 * (0.6 - 0.45 * wingFlap);
      ctx.beginPath();
      ctx.moveTo(-2, 1.5);
      ctx.bezierCurveTo(4, 7, 7, nearSpan * 0.7, -3, nearSpan);
      ctx.bezierCurveTo(-9, nearSpan * 0.8, -10, 7, -7, 1.5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      for (const p of pigeons) {
        // Move along trajectory with slight natural air current wave
        p.x += p.vx * dt;
        p.y += p.vy * dt + Math.sin(time * 0.0015 + p.scale * 10) * 0.25;

        // Wing flap cycle state machine (flap burst -> graceful glide)
        p.glideTimer += dt;
        if (!p.isGliding && p.glideTimer >= p.flapDuration) {
          p.isGliding = true;
          p.glideTimer = 0;
        } else if (p.isGliding && p.glideTimer >= p.glideDuration) {
          p.isGliding = false;
          p.glideTimer = 0;
        }

        if (!p.isGliding) {
          p.wingPhase += p.flapFrequency * dt * Math.PI * 2;
        } else {
          // Slow subtle breathing while gliding
          p.wingPhase += 1.5 * dt;
        }

        // Respawn when flew past the screen (wrap with margin)
        const margin = 100;
        if (p.x > width + margin || p.y < -margin) {
          p.x = -margin - Math.random() * 120;
          p.y = height * (0.4 + Math.random() * 0.55);
          p.vx = 35 + Math.random() * 20;
          p.vy = -(12 + Math.random() * 10);
        }

        drawPigeon(p);
      }

      animId = isIntersecting && !document.hidden ? requestAnimationFrame(loop) : 0;
    };

    const resizeObserver = new ResizeObserver(handleResize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isIntersecting = entry?.isIntersecting ?? true;
      if (isIntersecting && !animId) {
        lastTime = performance.now();
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
        lastTime = performance.now();
        animId = requestAnimationFrame(loop);
      }
    };

    resizeObserver.observe(container);
    intersectionObserver.observe(container);
    document.addEventListener("visibilitychange", handleVisibility);

    handleResize();
    lastTime = performance.now();
    animId = requestAnimationFrame(loop);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

