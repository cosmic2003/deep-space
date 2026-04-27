import type { RocketConfiguration } from "./sources/launchLibrary";

export type ShapeType =
  | "single"
  | "soyuz"
  | "srb"
  | "starship"
  | "falcon-heavy";

export interface ShapeSpec {
  type: ShapeType;
  srbCount?: number;
  bodyColor?: string;
  /** Visual engine count for the bottom-most stage (used for cluster rendering). */
  engineCount?: number;
  /** Optional GLB/GLTF URL. When set, RocketModel loads this instead of the procedural shape. */
  gltfUrl?: string;
}

export function getShape(config: RocketConfiguration): ShapeSpec {
  const name = (config.full_name ?? config.name).toLowerCase();
  const family = (config.family ?? "").toLowerCase();
  const variant = (config.variant ?? "").toLowerCase();

  if (name.includes("starship") || name.includes("super heavy")) {
    return { type: "starship", bodyColor: "#cbd5e1", engineCount: 33 };
  }
  if (name.includes("falcon heavy")) {
    return { type: "falcon-heavy" };
  }
  if (name.includes("falcon 9")) {
    return { type: "single", engineCount: 9 };
  }
  if (family.includes("soyuz") || name.includes("soyuz")) {
    if (name.includes("soyuz-5") || name.includes("soyuz 5")) {
      return { type: "single", engineCount: 1 };
    }
    return { type: "soyuz", srbCount: 4 };
  }
  // Atlas V variant pattern: 4XX = no SRB, 5XX = up to 5 SRBs
  const atlasMatch = name.match(/atlas\s*v\s*(\d)(\d)(\d)/);
  if (atlasMatch || family.includes("atlas")) {
    const srbDigit = atlasMatch ? parseInt(atlasMatch[2], 10) : 0;
    return { type: "srb", srbCount: srbDigit, engineCount: 1 };
  }
  if (name.includes("vulcan")) {
    return { type: "srb", srbCount: 2, engineCount: 2 };
  }
  // Ariane 6 variants: 62 = 2 SRBs, 64 = 4 SRBs
  if (family.includes("ariane 6") || name.includes("ariane 6")) {
    if (name.includes("ariane 64") || variant.includes("64")) {
      return { type: "srb", srbCount: 4, engineCount: 1 };
    }
    if (name.includes("ariane 62") || variant.includes("62")) {
      return { type: "srb", srbCount: 2, engineCount: 1 };
    }
    return { type: "srb", srbCount: 4, engineCount: 1 };
  }
  // SLS — 4 RS-25 + 2 SRB
  if (name.includes("sls")) {
    return { type: "srb", srbCount: 2, engineCount: 4 };
  }
  // H3 / H2A SRBs
  if (family.includes("h3") || family.includes("h2a")) {
    const eng = family.includes("h3") ? 3 : 1;
    if (variant.includes("4") || name.includes("-24") || name.includes("204")) {
      return { type: "srb", srbCount: 4, engineCount: eng };
    }
    if (variant.includes("2") || name.includes("-22") || name.includes("202")) {
      return { type: "srb", srbCount: 2, engineCount: eng };
    }
    return { type: "srb", srbCount: 2, engineCount: eng };
  }
  if (name.includes("gslv")) {
    return { type: "soyuz", srbCount: 4 };
  }
  if (name.includes("long march 5") || name.includes("cz-5")) {
    return { type: "soyuz", srbCount: 4 };
  }
  if (name.includes("long march 7") || name.includes("cz-7")) {
    return { type: "soyuz", srbCount: 4 };
  }
  if (name.includes("zhuque")) {
    return { type: "single", bodyColor: "#e0e7ff", engineCount: 4 };
  }
  if (name.includes("electron")) {
    return { type: "single", bodyColor: "#1f1f23", engineCount: 9 };
  }
  if (name.includes("neutron")) {
    return { type: "single", bodyColor: "#1f1f23", engineCount: 9 };
  }
  if (name.includes("new glenn")) {
    return { type: "single", engineCount: 7 };
  }
  if (name.includes("vega")) {
    return { type: "single", engineCount: 1 };
  }
  return { type: "single", engineCount: 1 };
}
