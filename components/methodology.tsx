import { CalendarClock, Database, Gauge, RefreshCw } from "lucide-react";

type MethodologyProps = {
  generatedAt: string;
  source: string;
  warnings: string[];
};

export function Methodology({
  generatedAt,
  source,
  warnings,
}: MethodologyProps) {
  const steps = [
    {
      icon: Database,
      number: "01",
      title: "Build the rating",
      text: "Opponent-adjusted offensive and defensive EPA per play, exponentially weighted with a six-game half-life and regressed toward the preseason prior.",
    },
    {
      icon: Gauge,
      number: "02",
      title: "Blend with ELWAY",
      text: "The default rating is 50% EPA and 50% Silver Bulletin ELWAY net rating. Missing weekly ELWAY files fall back to EPA without stopping the run.",
    },
    {
      icon: RefreshCw,
      number: "03",
      title: "Price the matchup",
      text: "Home field, rest, byes, early travel, and validated QBERT differences move the spread. Wind changes the total only.",
    },
    {
      icon: CalendarClock,
      number: "04",
      title: "Grade and learn",
      text: "Every game—including passes—is logged at the recorded line. Tuesday updates add final scores, closing lines, ATS results, and CLV.",
    },
  ];

  return (
    <section>
      <div className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-2">
        {steps.map(({ icon: Icon, number, title, text }) => (
          <article key={number} className="bg-[#0c1915] p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <Icon size={18} className="text-[#a9ff62]" />
              <span className="font-mono text-[10px] text-[#526159]">{number}</span>
            </div>
            <h2 className="mt-7 text-xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#8b9992]">{text}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="border border-white/10 bg-[#0c1915] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#a9ff62]">
            Weekly operating rhythm
          </p>
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-[84px_1fr] gap-4">
              <span className="font-mono text-xs text-[#dce2de]">TUESDAY</span>
              <div>
                <code className="text-xs text-[#a9ff62]">python weekly.py --update</code>
                <p className="mt-1 text-xs leading-5 text-[#718078]">
                  Results, grades, closing lines, ratings, and dashboard data.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-[84px_1fr] gap-4">
              <span className="font-mono text-xs text-[#dce2de]">WEDNESDAY</span>
              <p className="text-xs leading-5 text-[#718078]">
                Drop the two new Silver Bulletin CSVs into their week folders.
              </p>
            </div>
            <div className="grid grid-cols-[84px_1fr] gap-4">
              <span className="font-mono text-xs text-[#dce2de]">THURSDAY</span>
              <div>
                <code className="text-xs text-[#a9ff62]">python weekly.py --picks</code>
                <p className="mt-1 text-xs leading-5 text-[#718078]">
                  Current lines, weather, injuries, picks, and a fresh web bundle.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-white/10 bg-[#0c1915] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#a9ff62]">
            Snapshot status
          </p>
          <dl className="mt-5 space-y-3 text-xs">
            <div className="flex justify-between gap-4 border-b border-white/8 pb-3">
              <dt className="text-[#718078]">Generated</dt>
              <dd className="font-mono text-right text-[#c7d0ca]">
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: "America/New_York",
                }).format(new Date(generatedAt))}{" "}
                ET
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/8 pb-3">
              <dt className="text-[#718078]">Source bundle</dt>
              <dd className="font-mono text-right text-[#c7d0ca]">{source}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#718078]">Known warnings</dt>
              <dd className="font-mono text-right text-[#ffb86b]">
                {warnings.length}
              </dd>
            </div>
          </dl>
          {warnings.length > 0 && (
            <div className="mt-5 border-l-2 border-[#ffb86b]/60 pl-4">
              <p className="text-xs leading-5 text-[#9e9283]">
                Pro Football Reference is currently returning a cached 403. The
                model keeps running with expected ELWAY starters and marks the
                limitation instead of inventing an injury adjustment.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
