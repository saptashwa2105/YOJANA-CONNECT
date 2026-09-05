export interface DataPixelArcOptions {
  mode: "dark" | "light";
  speed: number;
  pixelSize: number;
  arcCenter: number;
  arcDrop: number;
  thickness: number;
  brightness: number;
  hue: number;
  saturation: number;
}

export const DATA_PIXEL_ARC_DEFAULTS: DataPixelArcOptions = {
  mode: "dark",
  speed: 1,
  pixelSize: 8,
  arcCenter: 0.4,
  arcDrop: 0.9,
  thickness: 0.35,
  brightness: 1,
  hue: 0,
  saturation: 1,
};

function normalizeMode(mode: unknown): "dark" | "light" {
  return mode === "light" || mode === 1 || mode === "1" ? "light" : "dark";
}

export function createDataPixelArcRenderer(
  canvas: HTMLCanvasElement,
  getOptions: () => DataPixelArcOptions
) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return null;

  let width = 1;
  let height = 1;
  let time = 0;
  let lightGradient: CanvasGradient | null = null;

  return {
    resize: (w: number, h: number) => {
      width = Math.max(1, w);
      height = Math.max(1, h);
      const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      lightGradient = ctx.createLinearGradient(0, 0, 0, height);
      lightGradient.addColorStop(0, "#f8faf6");
      lightGradient.addColorStop(0.58, "#f3f6f1");
      lightGradient.addColorStop(1, "#edf1ec");
    },
    render: () => {
      const opts = getOptions();
      const isLight = normalizeMode(opts.mode) === "light";
      ctx.fillStyle = isLight && lightGradient ? lightGradient : "#030308";
      ctx.fillRect(0, 0, width, height);

      const cols = Math.ceil(width / opts.pixelSize);
      const rows = Math.ceil(height / opts.pixelSize);
      const arcCenter = height * opts.arcCenter;
      const arcDrop = height * opts.arcDrop;
      const thickness = height * opts.thickness;

      for (let c = 0; c < cols; c += 1) {
        for (let r = 0; r < rows; r += 1) {
          const x = c * opts.pixelSize;
          const y = r * opts.pixelSize;
          const nx = (x / width) * 2 - 1;
          const arcY = arcCenter + Math.pow(Math.abs(nx), 1.8) * arcDrop;
          let dist = Math.max(0, 1 - Math.abs(y - arcY) / thickness);
          if (dist <= 0.01) continue;

          const wave1 = Math.sin(nx * 4 - time * 1.5) * 0.1;
          const wave2 = Math.cos(y * 0.01 + time) * 0.1;
          dist = Math.max(0, Math.min(1, dist + wave1 + wave2));
          dist *= Math.max(0, 1 - Math.pow(Math.abs(nx), 2.5));
          if (dist <= 0.02) continue;

          const distCube = Math.pow(dist, 3);
          const distPow = Math.pow(dist, 1.5);
          let red: number;
          let green: number;
          let blue: number;

          if (isLight) {
            const distLight = Math.pow(dist, 0.78);
            const bright = Math.max(0.45, Math.min(1.35, opts.brightness));
            const base = [238, 242, 237];
            const target = [
              192 - 172 * distLight - 10 * distCube,
              204 - 88 * distLight + 18 * distCube,
              193 - 132 * distLight + 4 * distCube,
            ];
            red = Math.max(0, Math.min(255, Math.round(base[0] + (target[0] - base[0]) * bright)));
            green = Math.max(0, Math.min(255, Math.round(base[1] + (target[1] - base[1]) * bright)));
            blue = Math.max(0, Math.min(255, Math.round(base[2] + (target[2] - base[2]) * bright)));
          } else {
            red = Math.floor((30 * dist + 100 * distCube) * opts.brightness);
            green = Math.floor((220 * distPow + 40 * distCube) * opts.brightness);
            blue = Math.floor((80 * dist + 50 * distCube) * opts.brightness);
          }

          ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
          ctx.globalAlpha = isLight ? Math.min(1, 0.22 + Math.pow(dist, 0.68) * 0.78) : dist;
          ctx.fillRect(x, y, opts.pixelSize - 1, opts.pixelSize - 1);
        }
      }

      ctx.globalAlpha = 1;
      time += 0.02 * opts.speed;
    },
  };
}

