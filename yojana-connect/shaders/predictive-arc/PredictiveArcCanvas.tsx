"use client";

import React from "react";
import {
  DataPixelArcCanvas,
  type DataPixelArcCanvasProps,
} from "../data-pixel-arc/DataPixelArcCanvas";

export interface PredictiveArcCanvasProps extends DataPixelArcCanvasProps {
  variant?: "predictive" | "data-pixel" | string;
}

export function PredictiveArcCanvas({
  variant = "data-pixel",
  ...props
}: PredictiveArcCanvasProps) {
  void variant;
  return <DataPixelArcCanvas {...props} />;
}

