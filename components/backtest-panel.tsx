import { AlertTriangle, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BacktestRow } from "@/lib/model";

type BacktestPanelProps = {
  rows: BacktestRow[];
  breakEvenRate: number;
  selectedThreshold: number;
  onSelectThreshold: (threshold: number) => void;
};

export function BacktestPanel({
  rows,
  breakEvenRate,
  selectedThreshold,
  onSelectThreshold,
}: BacktestPanelProps) {
  const best = rows.reduce<BacktestRow | null>(
    (current, row) =>
      current === null || row.win_rate > current.win_rate ? row : current,
    null,
  );
  const minimumRate = Math.min(
    ...rows.map((row) => row.win_rate),
    breakEvenRate,
  );
  const maximumRate = Math.max(
    ...rows.map((row) => row.win_rate),
    breakEvenRate,
  );
  const pad = Math.max((maximumRate - minimumRate) * 0.25, 0.01);
  const floor = minimumRate - pad;
  const ceiling = maximumRate + pad;
  const heightFor = (rate: number) =>
    `${Math.max(4, ((rate - floor) / (ceiling - floor)) * 100)}%`;
  const breakEvenBottom = ((breakEvenRate - floor) / (ceiling - floor)) * 100;

  return (
    <section>
      <div className="mb-6 border border-[#ffb86b]/25 bg-[#ffb86b]/[0.05] p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-[#ffb86b]" size={18} />
          <div>
            <p className="text-sm font-semibold text-[#ffd2a3]">
              The model did not beat standard-juice break-even in 2018–2025.
            </p>
            <p className="mt-1 text-xs leading-5 text-[#a89b89]">
              Its best tested cutoff was {best?.minimum_edge.toFixed(1) ?? "—"}
              {" points at "}
              {best ? `${(best.win_rate * 100).toFixed(1)}%` : "—"}, versus a
              {(breakEvenRate * 100).toFixed(1)}% break-even rate. Treat this as a
              transparent research tool—not betting advice.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="border border-white/10 bg-[#0c1915] p-5">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">
                ATS win rate by edge cutoff
              </h2>
              <p className="mt-1 text-xs text-[#718078]">
                Click a bar to send that threshold back to the live board.
              </p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#ffb86b]">
              Break-even {(breakEvenRate * 100).toFixed(1)}%
            </span>
          </div>

          <div className="relative mt-8 h-[310px] border-b border-white/10">
            <div
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[#ffb86b]/70"
              style={{ bottom: `${breakEvenBottom}%` }}
            >
              <span className="absolute right-0 top-1 font-mono text-[9px] text-[#ffb86b]">
                BE
              </span>
            </div>
            <div className="absolute inset-0 flex items-end gap-2 sm:gap-3">
              {rows.map((row) => {
                const selected = row.minimum_edge === selectedThreshold;
                return (
                  <button
                    key={row.minimum_edge}
                    type="button"
                    onClick={() => onSelectThreshold(row.minimum_edge)}
                    className="group flex h-full min-w-0 flex-1 flex-col justify-end focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a9ff62]"
                    aria-label={`Use ${row.minimum_edge.toFixed(1)} point threshold, ${(row.win_rate * 100).toFixed(1)} percent wins`}
                  >
                    <span className="mb-2 font-mono text-[10px] text-[#9ba8a1] opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100 sm:text-xs">
                      {(row.win_rate * 100).toFixed(1)}%
                    </span>
                    <span
                      className={`block w-full transition ${
                        selected
                          ? "bg-[#a9ff62]"
                          : "bg-[#345247] group-hover:bg-[#6f9a86]"
                      }`}
                      style={{ height: heightFor(row.win_rate) }}
                    />
                    <span
                      className={`mt-2 font-mono text-[9px] sm:text-[10px] ${
                        selected ? "text-[#a9ff62]" : "text-[#718078]"
                      }`}
                    >
                      {row.minimum_edge.toFixed(1)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border border-white/10">
          <div className="border-b border-white/10 bg-[#0a1713] px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">
              Threshold ledger
            </h2>
          </div>
          <div className="divide-y divide-white/8">
            {rows.map((row) => {
              const selected = row.minimum_edge === selectedThreshold;
              return (
                <Button
                  key={row.minimum_edge}
                  type="button"
                  variant="ghost"
                  onClick={() => onSelectThreshold(row.minimum_edge)}
                  className={`grid h-auto w-full grid-cols-[55px_1fr_70px_18px] items-center rounded-none px-4 py-2.5 text-left hover:bg-white/[0.04] ${
                    selected ? "bg-[#a9ff62]/[0.07]" : "bg-[#0c1915]"
                  }`}
                >
                  <span
                    className={`font-mono text-xs ${
                      selected ? "text-[#a9ff62]" : "text-[#9aa69f]"
                    }`}
                  >
                    {row.minimum_edge.toFixed(1)}+
                  </span>
                  <span className="font-mono text-[10px] text-[#67776f]">
                    {row.wins}-{row.losses}-{row.pushes} · {row.games} games
                  </span>
                  <span className="text-right font-mono text-xs text-[#dce2de]">
                    {(row.win_rate * 100).toFixed(1)}%
                  </span>
                  <ArrowRight
                    size={13}
                    className={selected ? "text-[#a9ff62]" : "text-[#526159]"}
                  />
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
