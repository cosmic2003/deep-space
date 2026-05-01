export interface SemiCompany {
  name: string;
  korean: string;
  country: string;
  flag: string;
  type: "foundry" | "fabless" | "memory" | "equipment" | "idm";
  primary: string;
  /** Plain-Korean explanation aimed at someone who doesn't follow the industry. */
  whyMatters: string;
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
    whyMatters: "전 세계 최첨단 칩의 90%를 만드는 대만 공장. NVIDIA, Apple 칩 다 여기서 찍어냄.",
    wikiUrl: "https://en.wikipedia.org/wiki/TSMC",
  },
  {
    name: "Samsung",
    korean: "삼성전자",
    country: "KR",
    flag: "🇰🇷",
    type: "idm",
    primary: "메모리 · 파운드리 (3GAA)",
    whyMatters: "메모리 1위 + TSMC를 추격하는 파운드리 2위. AI 시대 HBM 공급사 한 축.",
    wikiUrl: "https://en.wikipedia.org/wiki/Samsung_Electronics",
  },
  {
    name: "SK Hynix",
    korean: "SK 하이닉스",
    country: "KR",
    flag: "🇰🇷",
    type: "memory",
    primary: "HBM3E · DRAM 1위",
    whyMatters: "AI 칩 옆에 붙는 초고속 메모리 HBM 1위. NVIDIA가 이 회사 물량을 사실상 싹쓸이.",
    wikiUrl: "https://en.wikipedia.org/wiki/SK_Hynix",
  },
  {
    name: "NVIDIA",
    korean: "엔비디아",
    country: "US",
    flag: "🇺🇸",
    type: "fabless",
    primary: "GPU · AI 가속기",
    whyMatters: "AI 학습용 칩 사실상 독점. 데이터센터용 H200, B200이 있어야 ChatGPT가 돌아감.",
    wikiUrl: "https://en.wikipedia.org/wiki/Nvidia",
  },
  {
    name: "AMD",
    korean: "AMD",
    country: "US",
    flag: "🇺🇸",
    type: "fabless",
    primary: "CPU · GPU · MI 시리즈",
    whyMatters: "Intel을 누른 CPU 강자 + NVIDIA를 추격하는 AI 칩(MI300) 2인자.",
    wikiUrl: "https://en.wikipedia.org/wiki/AMD",
  },
  {
    name: "Intel",
    korean: "인텔",
    country: "US",
    flag: "🇺🇸",
    type: "idm",
    primary: "x86 · 18A 공정",
    whyMatters: "PC CPU의 상징. 자체 공장 + AI 칩 + 파운드리로 부활 시도 중. 미국 정부가 밀어줌.",
    wikiUrl: "https://en.wikipedia.org/wiki/Intel",
  },
  {
    name: "ASML",
    korean: "ASML",
    country: "NL",
    flag: "🇳🇱",
    type: "equipment",
    primary: "EUV 장비 독점",
    whyMatters: "최첨단 칩을 만들 수 있는 EUV 노광장비 세계 유일 제조사. 한 대에 2,000억 원.",
    wikiUrl: "https://en.wikipedia.org/wiki/ASML",
  },
  {
    name: "Micron",
    korean: "마이크론",
    country: "US",
    flag: "🇺🇸",
    type: "memory",
    primary: "DRAM · NAND · HBM3E",
    whyMatters: "한국 메모리 양강을 견제하는 미국 메모리 3인자. NVIDIA HBM 일부 공급.",
    wikiUrl: "https://en.wikipedia.org/wiki/Micron_Technology",
  },
];
