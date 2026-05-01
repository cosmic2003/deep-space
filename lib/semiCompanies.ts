export interface SemiCompany {
  name: string;
  korean: string;
  country: string;
  flag: string;
  type: "foundry" | "fabless" | "memory" | "equipment" | "idm";
  primary: string;
  wikiUrl: string;
}

export const SEMI_COMPANIES: SemiCompany[] = [
  {
    name: "TSMC",
    korean: "TSMC",
    country: "TW",
    flag: "🇹🇼",
    type: "foundry",
    primary: "Foundry · N2/N3 양산",
    wikiUrl: "https://en.wikipedia.org/wiki/TSMC",
  },
  {
    name: "Samsung",
    korean: "삼성전자",
    country: "KR",
    flag: "🇰🇷",
    type: "idm",
    primary: "메모리 · 파운드리 (3GAA)",
    wikiUrl: "https://en.wikipedia.org/wiki/Samsung_Electronics",
  },
  {
    name: "SK Hynix",
    korean: "SK 하이닉스",
    country: "KR",
    flag: "🇰🇷",
    type: "memory",
    primary: "HBM3E · DRAM 1위",
    wikiUrl: "https://en.wikipedia.org/wiki/SK_Hynix",
  },
  {
    name: "NVIDIA",
    korean: "엔비디아",
    country: "US",
    flag: "🇺🇸",
    type: "fabless",
    primary: "GPU · AI 가속기",
    wikiUrl: "https://en.wikipedia.org/wiki/Nvidia",
  },
  {
    name: "AMD",
    korean: "AMD",
    country: "US",
    flag: "🇺🇸",
    type: "fabless",
    primary: "CPU · GPU · MI 시리즈",
    wikiUrl: "https://en.wikipedia.org/wiki/AMD",
  },
  {
    name: "Intel",
    korean: "인텔",
    country: "US",
    flag: "🇺🇸",
    type: "idm",
    primary: "x86 · 18A 공정",
    wikiUrl: "https://en.wikipedia.org/wiki/Intel",
  },
  {
    name: "ASML",
    korean: "ASML",
    country: "NL",
    flag: "🇳🇱",
    type: "equipment",
    primary: "EUV 장비 독점",
    wikiUrl: "https://en.wikipedia.org/wiki/ASML",
  },
  {
    name: "Micron",
    korean: "마이크론",
    country: "US",
    flag: "🇺🇸",
    type: "memory",
    primary: "DRAM · NAND · HBM3E",
    wikiUrl: "https://en.wikipedia.org/wiki/Micron_Technology",
  },
];
