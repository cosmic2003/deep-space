import type { LaunchStatus } from "@/lib/sources/launchLibrary";

interface Props {
  status: LaunchStatus;
}

function styleFor(abbrev: string): { dot: string; text: string; ring: string } {
  switch (abbrev) {
    case "Go":
      return {
        dot: "bg-emerald-400",
        text: "text-emerald-300",
        ring: "ring-emerald-500/20",
      };
    case "TBC":
      return {
        dot: "bg-amber-400",
        text: "text-amber-300",
        ring: "ring-amber-500/20",
      };
    case "TBD":
      return {
        dot: "bg-zinc-400",
        text: "text-zinc-300",
        ring: "ring-zinc-500/20",
      };
    case "Hold":
      return {
        dot: "bg-red-400",
        text: "text-red-300",
        ring: "ring-red-500/20",
      };
    case "Success":
      return {
        dot: "bg-emerald-400",
        text: "text-emerald-300",
        ring: "ring-emerald-500/20",
      };
    case "Failure":
    case "Partial Failure":
      return {
        dot: "bg-red-400",
        text: "text-red-300",
        ring: "ring-red-500/20",
      };
    default:
      return {
        dot: "bg-sky-400",
        text: "text-sky-300",
        ring: "ring-sky-500/20",
      };
  }
}

export function StatusBadge({ status }: Props) {
  const s = styleFor(status.abbrev);
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-base font-bold tracking-wide ring-1 ring-inset ${s.text} ${s.ring} bg-zinc-900/60`}
    >
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {status.abbrev}
    </span>
  );
}
