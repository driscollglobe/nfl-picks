import { ArrowDown, ArrowUp } from "lucide-react";
import { TeamLabel } from "@/components/team-logo";

import { blendedRatings, signed, type Rating } from "@/lib/model";

type RatingsTableProps = {
  ratings: Rating[];
  epaWeight: number;
};

export function RatingsTable({ ratings, epaWeight }: RatingsTableProps) {
  const rows = blendedRatings(ratings, epaWeight);
  const maximum = Math.max(...rows.map((row) => Math.abs(row.blendedRating)), 1);
  const median = rows.length
    ? [...rows]
        .map((row) => row.blendedRating)
        .sort((a, b) => a - b)[Math.floor(rows.length / 2)]
    : 0;

  return (
    <section>
      <div className="mb-6 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-3">
        <div className="bg-[#0c1915] px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#67776f]">
            No. 1 team
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {rows[0] ? <TeamLabel team={rows[0].team} size={36} /> : "—"}
            <span className="ml-2 font-mono text-sm text-[#a9ff62]">
              {rows[0] ? signed(rows[0].blendedRating) : ""}
            </span>
          </p>
        </div>
        <div className="bg-[#0c1915] px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#67776f]">
            Rating blend
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {Math.round(epaWeight * 100)}
            <span className="ml-1 text-sm font-normal text-[#829189]">
              EPA / {Math.round((1 - epaWeight) * 100)} ELWAY
            </span>
          </p>
        </div>
        <div className="bg-[#0c1915] px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#67776f]">
            League midpoint
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold">
            {signed(median)}
          </p>
        </div>
      </div>

      <div className="mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">
          Power ratings
        </h2>
        <p className="mt-1 text-xs leading-5 text-[#718078]">
          Points above or below an average team on a neutral field. Adjust the EPA
          share in Model Lab to rerank the table.
        </p>
      </div>

      <div className="overflow-x-auto border border-white/10">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-[50px_70px_100px_100px_minmax(220px,1fr)] gap-4 border-b border-white/10 bg-[#0a1713] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#67776f]">
            <span>Rank</span>
            <span>Team</span>
            <span>EPA</span>
            <span>ELWAY</span>
            <span>Blended point value</span>
          </div>
          {rows.map((row, index) => {
            const magnitude = (Math.abs(row.blendedRating) / maximum) * 48;
            return (
              <div
                key={row.team}
                className="grid grid-cols-[50px_70px_100px_100px_minmax(220px,1fr)] items-center gap-4 border-b border-white/8 bg-[#0c1915] px-5 py-3.5 last:border-b-0"
              >
                <span className="font-mono text-xs text-[#67776f]">
                  {(index + 1).toString().padStart(2, "0")}
                </span>
                <span className="font-semibold text-[#edf1eb]"><TeamLabel team={row.team} size={24} /></span>
                <span className="font-mono text-xs text-[#9aa69f]">
                  {signed(row.epa_rating)}
                </span>
                <span className="font-mono text-xs text-[#9aa69f]">
                  {row.external_rating === null
                    ? "—"
                    : signed(row.external_rating)}
                </span>
                <div className="flex items-center gap-3">
                  <div className="relative h-2 flex-1 bg-white/[0.04]">
                    <span className="absolute bottom-[-3px] left-1/2 top-[-3px] w-px bg-white/15" />
                    <span
                      className={`absolute top-0 h-2 ${
                        row.blendedRating >= 0 ? "bg-[#a9ff62]" : "bg-[#ff8f70]"
                      }`}
                      style={
                        row.blendedRating >= 0
                          ? { left: "50%", width: `${magnitude}%` }
                          : { right: "50%", width: `${magnitude}%` }
                      }
                    />
                  </div>
                  <span
                    className={`flex w-14 items-center justify-end gap-1 font-mono text-xs font-semibold ${
                      row.blendedRating >= 0
                        ? "text-[#a9ff62]"
                        : "text-[#ff8f70]"
                    }`}
                  >
                    {row.blendedRating >= 0 ? (
                      <ArrowUp size={11} />
                    ) : (
                      <ArrowDown size={11} />
                    )}
                    {signed(row.blendedRating)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
