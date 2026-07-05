const bars = [42, 68, 55, 82, 71, 94, 78, 88, 65, 91, 76, 85];

export default function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-linear-to-b from-primary/20 via-primary/5 to-transparent" />
      <div className="absolute -top-20 left-1/2 h-40 w-3/4 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl animate-pulse-glow" />

      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-1 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-error/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
          <span className="ml-3 text-xs text-foreground-muted">
            dashboard.decode-analytics
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-success">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            Live
          </span>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-3">
          {[
            { label: "Visiteurs", value: "12 847", delta: "+12.4%" },
            { label: "Taux conversion", value: "3.2%", delta: "+0.8%" },
            { label: "Sessions actives", value: "284", delta: "live" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg border border-border-subtle bg-surface-0 p-4"
            >
              <p className="text-xs text-foreground-muted">{kpi.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                {kpi.value}
              </p>
              <p
                className={`mt-1 text-xs ${
                  kpi.delta === "live" ? "text-success" : "text-success"
                }`}
              >
                {kpi.delta === "live" ? "● En direct" : kpi.delta}
              </p>
            </div>
          ))}
        </div>

        <div className="mx-4 mb-4 rounded-lg border border-border-subtle bg-surface-0 p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium">Événements / heure</p>
            <div className="flex gap-1">
              {["1h", "24h", "7j"].map((period, i) => (
                <span
                  key={period}
                  className={`rounded px-2 py-0.5 text-xs ${
                    i === 1
                      ? "bg-primary-muted text-primary"
                      : "text-foreground-muted"
                  }`}
                >
                  {period}
                </span>
              ))}
            </div>
          </div>
          <div className="flex h-32 items-end gap-1.5">
            {bars.map((height, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-primary/80 transition-all"
                style={{
                  height: `${height}%`,
                  opacity: 0.4 + (height / 100) * 0.6,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
