const BASE = "https://ll.thespacedevs.com/2.2.0";

export interface LaunchStatus {
  id: number;
  name: string;
  abbrev: string;
  description?: string;
}

export interface LaunchProvider {
  id?: number;
  name: string;
  type?: string;
  abbrev?: string;
}

export interface RocketConfiguration {
  id?: number;
  name: string;
  full_name?: string;
  family?: string;
  variant?: string;
  length?: number | null;
  diameter?: number | null;
  launch_mass?: number | null;
  leo_capacity?: number | null;
  gto_capacity?: number | null;
  to_thrust?: number | null;
  reusable?: boolean;
  maiden_flight?: string | null;
  launch_cost?: string | null;
  image_url?: string | null;
  info_url?: string | null;
  wiki_url?: string | null;
  total_launch_count?: number;
  successful_launches?: number;
  failed_launches?: number;
  consecutive_successful_launches?: number;
  pending_launches?: number;
  attempted_landings?: number;
  successful_landings?: number;
  failed_landings?: number;
  minimum_stage?: number;
  maximum_stage?: number;
  description?: string;
}

export interface LaunchRocket {
  configuration: RocketConfiguration;
}

export interface LaunchMission {
  name: string;
  description?: string;
  type?: string;
  orbit?: { name?: string; abbrev?: string } | null;
}

export interface LaunchPad {
  name: string;
  location: { name: string; country_code?: string };
}

export interface LaunchVideo {
  url: string;
  title?: string;
  type?: { name: string };
}

export interface LaunchImage {
  image_url: string;
  thumbnail_url?: string;
}

export interface Launch {
  id: string;
  name: string;
  status: LaunchStatus;
  net: string;
  window_start?: string;
  window_end?: string;
  launch_service_provider: LaunchProvider;
  rocket: LaunchRocket;
  mission: LaunchMission | null;
  pad: LaunchPad;
  image?: LaunchImage | null;
  image_url?: string | null;
  vidURLs?: LaunchVideo[];
  webcast_live?: boolean;
}

export interface LauncherCore {
  id?: number;
  serial_number?: string;
  flight_proven?: boolean;
  status?: string;
  details?: string;
  flights?: number;
  last_launch_date?: string | null;
  first_launch_date?: string | null;
}

export interface Landing {
  attempt: boolean;
  success?: boolean | null;
  description?: string;
  location?: { name: string; abbrev?: string } | null;
  type?: { name: string; abbrev?: string } | null;
}

export interface LauncherStage {
  type?: string;
  reused?: boolean;
  launcher_flight_number?: number;
  launcher?: LauncherCore;
  landing?: Landing | null;
}

export interface LaunchDetail extends Launch {
  rocket: LaunchRocket & {
    launcher_stage?: LauncherStage[];
  };
  mission: (LaunchMission & {
    description?: string;
  }) | null;
  pad: LaunchPad & {
    latitude?: string;
    longitude?: string;
    map_url?: string;
    total_launch_count?: number;
  };
  net_precision?: { name: string; abbrev: string; description?: string };
  probability?: number | null;
  weather_concerns?: string | null;
  failreason?: string;
  hashtag?: string | null;
  infoURLs?: Array<{ url: string; title?: string; description?: string }>;
}

interface LaunchListResponse {
  count: number;
  results: Launch[];
}

export async function getUpcomingLaunches(limit = 12): Promise<Launch[]> {
  const url = `${BASE}/launch/upcoming/?limit=${limit}&mode=detailed&hide_recent_previous=true`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.error(`[LL2] upstream ${res.status} ${res.statusText}`);
      return [];
    }
    const data = (await res.json()) as LaunchListResponse;
    return data.results ?? [];
  } catch (e) {
    console.error("[LL2] fetch error", e);
    return [];
  }
}

export async function getLaunchDetail(id: string): Promise<LaunchDetail | null> {
  const url = `${BASE}/launch/${encodeURIComponent(id)}/?mode=detailed`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.error(`[LL2] detail ${res.status} ${res.statusText}`);
      return null;
    }
    return (await res.json()) as LaunchDetail;
  } catch (e) {
    console.error("[LL2] detail fetch error", e);
    return null;
  }
}

export interface ProviderRockets {
  providerId: number | string;
  providerName: string;
  rockets: RocketConfiguration[];
}

export function groupRocketsByProvider(launches: Launch[]): ProviderRockets[] {
  const map = new Map<string, ProviderRockets>();
  const seenRocketIds = new Map<string, Set<number | string>>();

  for (const l of launches) {
    const pId = l.launch_service_provider.id ?? l.launch_service_provider.name;
    const pKey = String(pId);
    if (!map.has(pKey)) {
      map.set(pKey, {
        providerId: pId,
        providerName: l.launch_service_provider.name,
        rockets: [],
      });
      seenRocketIds.set(pKey, new Set());
    }
    const config = l.rocket.configuration;
    const rId = config.id ?? config.full_name ?? config.name;
    const seen = seenRocketIds.get(pKey)!;
    if (!seen.has(rId)) {
      seen.add(rId);
      map.get(pKey)!.rockets.push(config);
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.providerName.localeCompare(b.providerName)
  );
}

export function pickLiveStream(launch: Launch): LaunchVideo | null {
  if (!launch.vidURLs || launch.vidURLs.length === 0) return null;
  const yt = launch.vidURLs.find((v) => /youtube|youtu\.be/i.test(v.url));
  return yt ?? launch.vidURLs[0];
}

export function pickImage(launch: Launch): string | null {
  return launch.image?.image_url ?? launch.image_url ?? null;
}
