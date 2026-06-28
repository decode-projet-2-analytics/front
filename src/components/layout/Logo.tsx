import { Link } from "@/i18n/navigation";

type LogoProps = {
  href?: string;
  size?: "sm" | "md";
};

export default function Logo({ href = "/", size = "md" }: LogoProps) {
  const iconSize = size === "sm" ? "h-7 w-7 text-xs" : "h-8 w-8 text-sm";

  return (
    <Link href={href} className="group flex items-center gap-2.5">
      <span
        className={`flex ${iconSize} shrink-0 items-center justify-center rounded-md bg-primary-muted font-semibold text-primary transition-colors group-hover:bg-primary/25`}
      >
        d
      </span>
      <span className="text-[15px] font-medium tracking-tight">
        <span className="text-foreground-muted">decode</span>
        <span className="text-foreground">-analytics</span>
      </span>
    </Link>
  );
}
