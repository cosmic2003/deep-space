export interface RocketKnowledge {
  manufacturer?: string;
  firstStageEngines?: string;
  firstStagePropellant?: string;
  upperStageEngines?: string;
  upperStagePropellant?: string;
  notes?: string;
}

const DB: Record<string, RocketKnowledge> = {
  "falcon 9": {
    manufacturer: "SpaceX",
    firstStageEngines: "9 × Merlin 1D",
    firstStagePropellant: "RP-1 / LOX",
    upperStageEngines: "1 × Merlin 1D Vacuum",
    upperStagePropellant: "RP-1 / LOX",
  },
  "falcon heavy": {
    manufacturer: "SpaceX",
    firstStageEngines: "27 × Merlin 1D (3 코어 × 9)",
    firstStagePropellant: "RP-1 / LOX",
    upperStageEngines: "1 × Merlin 1D Vacuum",
    upperStagePropellant: "RP-1 / LOX",
  },
  starship: {
    manufacturer: "SpaceX",
    firstStageEngines: "33 × Raptor 2 (Super Heavy)",
    firstStagePropellant: "CH4 / LOX (메탈록스)",
    upperStageEngines: "6 × Raptor (3 SL + 3 Vac)",
    upperStagePropellant: "CH4 / LOX",
  },
  "atlas v": {
    manufacturer: "ULA / Aerojet Rocketdyne",
    firstStageEngines: "1 × RD-180 (러시아)",
    firstStagePropellant: "RP-1 / LOX",
    upperStageEngines: "1~2 × RL10 (Centaur)",
    upperStagePropellant: "LH2 / LOX",
    notes: "0~5개 GEM-63 고체 부스터 옵션",
  },
  "vulcan centaur": {
    manufacturer: "ULA",
    firstStageEngines: "2 × BE-4 (Blue Origin)",
    firstStagePropellant: "CH4 / LOX",
    upperStageEngines: "2 × RL10C-1-1A",
    upperStagePropellant: "LH2 / LOX",
  },
  delta: {
    manufacturer: "ULA",
    firstStageEngines: "1 × RS-68A",
    firstStagePropellant: "LH2 / LOX",
    upperStageEngines: "1 × RL10B-2",
    upperStagePropellant: "LH2 / LOX",
  },
  soyuz: {
    manufacturer: "Roscosmos / Progress",
    firstStageEngines: "4 × RD-107A (스트랩온) + 1 × RD-108A (코어)",
    firstStagePropellant: "RP-1 / LOX",
    upperStageEngines: "1 × RD-0124 (Soyuz 2.1b)",
    upperStagePropellant: "RP-1 / LOX",
  },
  "soyuz-5": {
    manufacturer: "RKK Energiya",
    firstStageEngines: "1 × RD-171MV",
    firstStagePropellant: "RP-1 / LOX",
    upperStageEngines: "1 × RD-0124MS",
    upperStagePropellant: "RP-1 / LOX",
  },
  "ariane 6": {
    manufacturer: "ArianeGroup / Avio",
    firstStageEngines: "1 × Vulcain 2.1 + 2/4 × P120C SRB",
    firstStagePropellant: "LH2 / LOX (코어), HTPB (SRB)",
    upperStageEngines: "1 × Vinci",
    upperStagePropellant: "LH2 / LOX",
  },
  "ariane 64": {
    manufacturer: "ArianeGroup / Avio",
    firstStageEngines: "1 × Vulcain 2.1 + 4 × P120C SRB",
    firstStagePropellant: "LH2 / LOX (코어), HTPB (SRB)",
    upperStageEngines: "1 × Vinci",
    upperStagePropellant: "LH2 / LOX",
  },
  vega: {
    manufacturer: "Avio S.p.A",
    firstStageEngines: "1 × P80 (SRB)",
    firstStagePropellant: "HTPB (고체)",
    upperStageEngines: "Z23 + Z9 (고체) + AVUM (액체)",
    upperStagePropellant: "HTPB / N2O4 + UDMH",
  },
  "vega-c": {
    manufacturer: "Avio S.p.A",
    firstStageEngines: "1 × P120C",
    firstStagePropellant: "HTPB (고체)",
    upperStageEngines: "Zefiro 40 + Zefiro 9 + AVUM+",
    upperStagePropellant: "HTPB / N2O4 + UDMH",
  },
  "zhuque-2": {
    manufacturer: "LandSpace",
    firstStageEngines: "4 × TQ-12 + 1 × TQ-11 (vernier)",
    firstStagePropellant: "CH4 / LOX (메탈록스)",
    upperStageEngines: "1 × TQ-15A",
    upperStagePropellant: "CH4 / LOX",
    notes: "세계 최초 메탄 추진제로 궤도 도달",
  },
  "zhuque-2e": {
    manufacturer: "LandSpace",
    firstStageEngines: "4 × TQ-12B + 1 × TQ-11",
    firstStagePropellant: "CH4 / LOX",
    upperStageEngines: "1 × TQ-15A",
    upperStagePropellant: "CH4 / LOX",
  },
  "long march 2": {
    manufacturer: "CASC",
    firstStageEngines: "4 × YF-21C",
    firstStagePropellant: "N2O4 / UDMH",
    upperStageEngines: "1 × YF-24",
    upperStagePropellant: "N2O4 / UDMH",
  },
  "long march 3": {
    manufacturer: "CASC",
    firstStageEngines: "4 × YF-21C",
    firstStagePropellant: "N2O4 / UDMH",
    upperStageEngines: "1 × YF-75",
    upperStagePropellant: "LH2 / LOX",
  },
  "long march 5": {
    manufacturer: "CASC",
    firstStageEngines: "2 × YF-77 + 4 × YF-100 부스터",
    firstStagePropellant: "LH2 / LOX (코어), RP-1 / LOX (부스터)",
    upperStageEngines: "2 × YF-75D",
    upperStagePropellant: "LH2 / LOX",
  },
  "long march 7": {
    manufacturer: "CASC",
    firstStageEngines: "2 × YF-100 + 4 × YF-100 부스터",
    firstStagePropellant: "RP-1 / LOX",
    upperStageEngines: "4 × YF-115",
    upperStagePropellant: "RP-1 / LOX",
  },
  electron: {
    manufacturer: "Rocket Lab",
    firstStageEngines: "9 × Rutherford (전기 펌프)",
    firstStagePropellant: "RP-1 / LOX",
    upperStageEngines: "1 × Rutherford Vacuum",
    upperStagePropellant: "RP-1 / LOX",
  },
  neutron: {
    manufacturer: "Rocket Lab",
    firstStageEngines: "9 × Archimedes",
    firstStagePropellant: "CH4 / LOX",
    upperStageEngines: "1 × Archimedes Vacuum",
    upperStagePropellant: "CH4 / LOX",
  },
  h3: {
    manufacturer: "MHI / JAXA",
    firstStageEngines: "2~3 × LE-9 + 0/2/4 × SRB-3",
    firstStagePropellant: "LH2 / LOX (코어), HTPB (SRB)",
    upperStageEngines: "1 × LE-5B-3",
    upperStagePropellant: "LH2 / LOX",
  },
  h2a: {
    manufacturer: "MHI / JAXA",
    firstStageEngines: "1 × LE-7A + 2/4 × SRB-A3",
    firstStagePropellant: "LH2 / LOX",
    upperStageEngines: "1 × LE-5B",
    upperStagePropellant: "LH2 / LOX",
  },
  "new glenn": {
    manufacturer: "Blue Origin",
    firstStageEngines: "7 × BE-4",
    firstStagePropellant: "CH4 / LOX",
    upperStageEngines: "2 × BE-3U",
    upperStagePropellant: "LH2 / LOX",
  },
  sls: {
    manufacturer: "NASA / Boeing / Northrop Grumman",
    firstStageEngines: "4 × RS-25 + 2 × Five-segment SRB",
    firstStagePropellant: "LH2 / LOX (코어), PBAN (SRB)",
    upperStageEngines: "ICPS: 1 × RL10B-2",
    upperStagePropellant: "LH2 / LOX",
  },
  gslv: {
    manufacturer: "ISRO",
    firstStageEngines: "1 × Vikas + 4 × L40 부스터",
    firstStagePropellant: "N2O4 / UH25",
    upperStageEngines: "1 × CE-7.5",
    upperStagePropellant: "LH2 / LOX",
  },
  pslv: {
    manufacturer: "ISRO",
    firstStageEngines: "S-139 SRB + 0/2/4/6 × PSOM 스트랩온",
    firstStagePropellant: "HTPB (고체)",
    upperStageEngines: "Vikas (PS2) + PS3 + PS4",
    upperStagePropellant: "N2O4 / UH25 / MMH+MON",
  },
  minotaur: {
    manufacturer: "Northrop Grumman",
    firstStageEngines: "Peacekeeper SR118-120 + Orion 38",
    firstStagePropellant: "HTPB (고체)",
    upperStageEngines: "Orion 38",
    upperStagePropellant: "HTPB",
  },
  antares: {
    manufacturer: "Northrop Grumman",
    firstStageEngines: "2 × RD-181 (Antares 230)",
    firstStagePropellant: "RP-1 / LOX",
    upperStageEngines: "Castor 30XL (고체)",
    upperStagePropellant: "HTPB",
  },
};

const FAMILY_ALIASES: Record<string, string> = {
  "falcon 9 block 5": "falcon 9",
  "falcon 9 block": "falcon 9",
  "atlas v 401": "atlas v",
  "atlas v 411": "atlas v",
  "atlas v 421": "atlas v",
  "atlas v 431": "atlas v",
  "atlas v 501": "atlas v",
  "atlas v 511": "atlas v",
  "atlas v 521": "atlas v",
  "atlas v 531": "atlas v",
  "atlas v 541": "atlas v",
  "atlas v 551": "atlas v",
  "soyuz 2.1a": "soyuz",
  "soyuz 2.1b": "soyuz",
  "soyuz 2.1v": "soyuz",
  "soyuz st-a": "soyuz",
  "soyuz st-b": "soyuz",
  "ariane 62": "ariane 6",
  "long march 2c": "long march 2",
  "long march 2d": "long march 2",
  "long march 2f": "long march 2",
  "long march 3a": "long march 3",
  "long march 3b": "long march 3",
  "long march 3c": "long march 3",
  "long march 5b": "long march 5",
  "long march 7a": "long march 7",
  "h2a 202": "h2a",
  "h2a 204": "h2a",
  "h3-22": "h3",
  "h3-24": "h3",
  "minotaur iv": "minotaur",
  "minotaur i": "minotaur",
  "antares 230": "antares",
  "antares 230+": "antares",
};

export function lookupRocket(name: string, family?: string): RocketKnowledge | null {
  const candidates = [name, family]
    .filter((s): s is string => typeof s === "string" && s.length > 0)
    .map((s) => s.toLowerCase().trim());

  for (const c of candidates) {
    if (DB[c]) return DB[c];
    if (FAMILY_ALIASES[c]) return DB[FAMILY_ALIASES[c]];
  }
  // Substring match
  for (const c of candidates) {
    for (const key of Object.keys(DB)) {
      if (c.includes(key)) return DB[key];
    }
  }
  return null;
}
