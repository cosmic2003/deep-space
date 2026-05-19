export type AICompany =
  | "openai"
  | "anthropic"
  | "google-deepmind"
  | "xai"
  | "meta-ai";

export type PostSource = "blog" | "x" | "paper" | "github" | "reddit" | "hn";

export interface AIPost {
  id: string;
  company: AICompany;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: PostSource;
  tags?: string[];
}

export interface DailyDigest {
  date: string;
  summary: string;
  highlights: { title: string; company: AICompany; url?: string }[];
}

export interface CompanyInfo {
  slug: AICompany;
  name: string;
  dot: string;
  text: string;
  bg: string;
  ring: string;
}

export const COMPANIES: CompanyInfo[] = [
  {
    slug: "openai",
    name: "OpenAI",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/30",
  },
  {
    slug: "anthropic",
    name: "Anthropic",
    dot: "bg-amber-400",
    text: "text-amber-300",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/30",
  },
  {
    slug: "google-deepmind",
    name: "Google DeepMind",
    dot: "bg-sky-400",
    text: "text-sky-300",
    bg: "bg-sky-500/10",
    ring: "ring-sky-500/30",
  },
  {
    slug: "xai",
    name: "xAI",
    dot: "bg-zinc-300",
    text: "text-zinc-200",
    bg: "bg-zinc-500/10",
    ring: "ring-zinc-400/30",
  },
  {
    slug: "meta-ai",
    name: "Meta AI",
    dot: "bg-blue-400",
    text: "text-blue-300",
    bg: "bg-blue-500/10",
    ring: "ring-blue-500/30",
  },
];

export const COMPANY_MAP: Record<AICompany, CompanyInfo> = Object.fromEntries(
  COMPANIES.map((c) => [c.slug, c])
) as Record<AICompany, CompanyInfo>;
