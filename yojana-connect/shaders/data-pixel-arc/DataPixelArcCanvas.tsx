"use client";

import React, { useRef, useEffect } from "react";
import {
  DATA_PIXEL_ARC_DEFAULTS,
  createDataPixelArcRenderer,
  type DataPixelArcOptions,
} from "./dataPixelArcRenderer";

export interface DataPixelArcCanvasProps extends Partial<DataPixelArcOptions> {
  className?: string;
}

export function DataPixelArcCanvas({ className = "", ...props }: DataPixelArcCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resolvedOptions: DataPixelArcOptions = { ...DATA_PIXEL_ARC_DEFAULTS, ...props };
  const optionsRef = useRef<DataPixelArcOptions>(resolvedOptions);

  useEffect(() => {
    optionsRef.current = resolvedOptions;
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const renderer = createDataPixelArcRenderer(canvas, () => optionsRef.current);
    if (!renderer) return;

    let animId = 0;
    let isIntersecting = true;

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      renderer.resize(rect.width, rect.height);
      renderer.render();
    };

    const loop = () => {
      renderer.render();
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
    <div
      ref={containerRef}
      className={`threeui-background data-pixel-arc data-pixel-arc--${resolvedOptions.mode}${
        className ? ` ${className}` : ""
      }`}
      data-mode={resolvedOptions.mode}
    >
      <canvas
        ref={canvasRef}
        style={{
          filter: `hue-rotate(${resolvedOptions.hue}deg) saturate(${resolvedOptions.saturation})`,
        }}
      />
    </div>
  );
}

