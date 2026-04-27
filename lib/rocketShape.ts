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
}

export function getShape(config: RocketConfiguration): ShapeSpec {
  const name = (config.full_name ?? config.name).toLowerCase();
  const family = (config.family ?? "").toLowerCase();
  const variant = (config.variant ?? "").toLowerCase();

  if (name.includes("starship") || name.includes("super heavy")) {
    return { type: "starship", bodyColor: "#cbd5e1" };
  }
  if (name.includes("falcon heavy")) {
    return { type: "falcon-heavy" };
  }
  if (family.includes("soyuz") || name.includes("soyuz")) {
    if (name.includes("soyuz-5") || name.includes("soyuz 5")) {
      return { type: "single" };
    }
    return { type: "soyuz", srbCount: 4 };
  }
  // Atlas V variant pattern: 4XX = no SRB, 5XX = up to 5 SRBs
  // Variant string like "551", "401", "411"
  const atlasMatch = name.match(/atlas\s*v\s*(\d)(\d)(\d)/);
  if (atlasMatch || family.includes("atlas")) {
    const srbDigit = atlasMatch ? parseInt(atlasMatch[2], 10) : 0;
    return { type: "srb", srbCount: srbDigit };
  }
  // Ariane 6 variants: 62 = 2 SRBs, 64 = 4 SRBs
  if (family.includes("ariane 6") || name.includes("ariane 6")) {
    if (name.includes("ariane 64") || variant.includes("64")) {
      return { type: "srb", srbCount: 4 };
    }
    if (name.includes("ariane 62") || variant.includes("62")) {
      return { type: "srb", srbCount: 2 };
    }
    return { type: "srb", srbCount: 4 };
  }
  // SLS-style 2 SRBs
  if (name.includes("sls")) {
    return { type: "srb", srbCount: 2 };
  }
  // H3 / H2A SRBs
  if (family.includes("h3") || family.includes("h2a")) {
    if (variant.includes("4") || name.includes("-24") || name.includes("204")) {
      return { type: "srb", srbCount: 4 };
    }
    if (variant.includes("2") || name.includes("-22") || name.includes("202")) {
      return { type: "srb", srbCount: 2 };
    }
    return { type: "srb", srbCount: 2 };
  }
  // GSLV with 4 strap-on
  if (name.includes("gslv")) {
    return { type: "soyuz", srbCount: 4 };
  }
  // Long March 5 with 4 strap-on
  if (name.includes("long march 5") || name.includes("cz-5")) {
    return { type: "soyuz", srbCount: 4 };
  }
  // Long March 7 with 4 strap-on
  if (name.includes("long march 7") || name.includes("cz-7")) {
    return { type: "soyuz", srbCount: 4 };
  }
  if (name.includes("zhuque")) {
    return { type: "single", bodyColor: "#e0e7ff" };
  }
  if (name.includes("electron")) {
    return { type: "single", bodyColor: "#1f1f23" };
  }
  if (name.includes("vega")) {
    return { type: "single" };
  }
  return { type: "single" };
}
