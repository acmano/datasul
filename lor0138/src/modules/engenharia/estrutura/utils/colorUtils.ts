// src/modules/engenharia/estrutura/utils/colorUtils.ts

/**
 * Utilitários para manipulação de cores e geração de degradês por nível
 */

export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const hexToRgb = (hex: string): RGB => {
  const h = hex.replace('#', '');
  const v =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const bigint = parseInt(v, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
};

export const rgbToHsl = (r: number, g: number, b: number): HSL => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

export const hexToHsl = (hex: string): HSL => {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
};

export const hslToRgb = (h: number, s: number, l: number): RGB => {
  h /= 360;
  s /= 100;
  l /= 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) {
      t += 1;
    }
    if (t > 1) {
      t -= 1;
    }
    if (t < 1 / 6) {
      return p + (q - p) * 6 * t;
    }
    if (t < 1 / 2) {
      return q;
    }
    if (t < 2 / 3) {
      return p + (q - p) * (2 / 3 - t) * 6;
    }
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
};

export const hslToCss = (h: number, s: number, l: number): string => {
  return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
};

export const luminanceFromHsl = (h: number, s: number, l: number): number => {
  const { r, g, b } = hslToRgb(h, s, l);
  const [R, G, B] = [r, g, b].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

export const contrastTextForHsl = (h: number, s: number, l: number): string => {
  const L = luminanceFromHsl(h, s, l);
  return L < 0.48 ? '#fff' : '#111';
};

/**
 * Cria função geradora de cores por nível
 * Mantém H e S fixos, varia apenas L entre Lmin e Lmax
 */
export const makeLevelHslGradient = (baseHsl: HSL, maxLevel: number) => {
  const sFix = clamp(baseHsl.s, 45, 85); // saturação mantida alta
  const Lmin = 28; // mais escuro no topo
  const Lmax = 82; // mais claro nos níveis profundos
  const denom = Math.max(1, maxLevel); // evita divisão por zero

  return (level: number): HSL => {
    const t = clamp(level / denom, 0, 1);
    const l = Math.round(Lmin + (Lmax - Lmin) * t);
    return { h: baseHsl.h, s: sFix, l };
  };
};
