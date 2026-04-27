const MAP: Record<string, string> = {
  spacex: "#38bdf8",
  "united launch alliance": "#60a5fa",
  arianespace: "#a78bfa",
  "rocket lab": "#fbbf24",
  blue_origin: "#22d3ee",
  "blue origin": "#22d3ee",
  "russian federal space agency (roscosmos)": "#fb923c",
  roscosmos: "#fb923c",
  "rkk energiya": "#fb923c",
  landspace: "#f87171",
  galactic_energy: "#f87171",
  cas: "#f87171",
  "china aerospace science and technology corporation": "#f87171",
  isro: "#f97316",
  "japan aerospace exploration agency": "#f472b6",
  jaxa: "#f472b6",
  nasa: "#ef4444",
  "northrop grumman": "#facc15",
  "avio s.p.a": "#a78bfa",
  firefly_aerospace: "#facc15",
  "firefly aerospace": "#facc15",
};

export function providerColor(name: string): string {
  const k = name.toLowerCase();
  if (MAP[k]) return MAP[k];
  for (const key of Object.keys(MAP)) {
    if (k.includes(key)) return MAP[key];
  }
  return "#38bdf8";
}
