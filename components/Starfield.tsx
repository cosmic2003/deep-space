// Deterministic pseudo-random — same output server & client (no hydration mismatch).
function rand(seed: number): number {
  const x = Math.sin(seed * 9999.7) * 10000;
  return x - Math.floor(x);
}

interface Star {
  x: number;
  y: number;
  r: number;
  o: number;
  twinkle: boolean;
  hue: "white" | "blue" | "amber";
}

const HUE: Record<Star["hue"], string> = {
  white: "#ffffff",
  blue: "#bfdbfe",
  amber: "#fde68a",
};

interface Props {
  count?: number;
}

export function Starfield({ count = 380 }: Props) {
  const stars: Star[] = Array.from({ length: count }, (_, i) => {
    const sizeRoll = rand(i * 3.1 + 7);
    const hueRoll = rand(i * 11.7 + 31);
    return {
      x: rand(i * 1.3 + 1) * 100,
      y: rand(i * 2.7 + 13) * 100,
      r: sizeRoll * sizeRoll * 1.9 + 0.3, // bias to small stars, occasional bigger
      o: rand(i * 5.3 + 17) * 0.6 + 0.3,
      twinkle: rand(i * 7.7 + 23) > 0.45, // ~55% twinkle
      hue: hueRoll > 0.9 ? "amber" : hueRoll > 0.65 ? "blue" : "white",
    };
  });

  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      {/* Subtle nebula glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 18% 22%, rgba(99, 102, 241, 0.08), transparent 60%),
            radial-gradient(ellipse 50% 35% at 82% 78%, rgba(56, 189, 248, 0.06), transparent 60%),
            radial-gradient(ellipse 35% 25% at 50% 55%, rgba(168, 85, 247, 0.05), transparent 60%)
          `,
        }}
      />

      {/* Starfield SVG */}
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="star-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {stars.map((s, i) => {
          const isBig = s.r > 1.4;
          return (
            <circle
              key={i}
              cx={`${s.x}%`}
              cy={`${s.y}%`}
              r={s.r}
              fill={HUE[s.hue]}
              opacity={s.o}
              filter={isBig || s.twinkle ? "url(#star-glow)" : undefined}
              className={s.twinkle ? "twinkle" : undefined}
              style={
                s.twinkle
                  ? {
                      animationDelay: `${(i % 11) * 0.3}s`,
                      animationDuration: `${1.8 + (i % 5) * 0.5}s`,
                    }
                  : undefined
              }
            />
          );
        })}
      </svg>
    </div>
  );
}
