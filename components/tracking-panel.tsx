import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Summary = {
  season?: number; week?: number; picks: number; wins: number; losses: number;
  pushes: number; pending: number; passes: number; locked: number;
  winRate: number | null; averageClv: number | null; clvCount: number;
};
type SavedPick = {
  season: number; week: number; game_id: string; home: string; away: string;
  pick: string; market_spread_at_pick: number | null; result_ats: string | null; clv: number | null;
};
export type TrackingData = {
  overall: Summary; seasons: Summary[]; weeks: Summary[]; rows: SavedPick[];
  source: string; benchmark: string;
};

function record(row: Summary) {
  return `${row.wins}–${row.losses}–${row.pushes}`;
}
function percentage(value: number | null) {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}
function savedSide(row: SavedPick) {
  if (row.pick !== "HOME" && row.pick !== "AWAY") return row.pick === "LOCKED" ? "Locked" : "Pass";
  const line = row.market_spread_at_pick === null ? null : row.pick === "HOME" ? -row.market_spread_at_pick : row.market_spread_at_pick;
  return `${row.pick === "HOME" ? row.home : row.away} ${line === null ? "—" : `${line > 0 ? "+" : ""}${line}`}`;
}

export function TrackingPanel({ data, season, generatedAt }: { data: TrackingData; season: number; generatedAt: string }) {
  const current = data.seasons.find((row) => row.season === season);
  const cards = [
    { label: `${season} record · W–L–P`, value: current ? record(current) : "0–0–0" },
    { label: "All-time record · W–L–P", value: record(data.overall) },
    { label: "All-time win rate", value: percentage(data.overall.winRate) },
    { label: "Awaiting results", value: String(data.overall.pending) },
  ];
  return <section className="tracking-panel">
    <div className="tracking-stats">{cards.map(({ label, value }) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <p className="tracking-note">Saved model selections—not confirmed wagers. Slider changes do not change this record. Passes and locked games are excluded; pushes do not count toward win rate.</p>
    <h2>Week by week</h2>
    <Table><TableHeader><TableRow>{["Season / week", "Picks", "W–L–P", "Win rate", "Pending", "Passes", "Pinnacle CLV"].map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{data.weeks.map((row) => <TableRow key={`${row.season}-${row.week}`}><TableCell>{row.season} / Week {row.week}</TableCell><TableCell>{row.picks}</TableCell><TableCell>{record(row)}</TableCell><TableCell>{percentage(row.winRate)}</TableCell><TableCell>{row.pending}</TableCell><TableCell>{row.passes}</TableCell><TableCell>{row.averageClv === null ? "—" : `${row.averageClv > 0 ? "+" : ""}${row.averageClv.toFixed(2)} pts (${row.clvCount})`}</TableCell></TableRow>)}</TableBody></Table>
    {!data.weeks.length && <p>No saved picks yet.</p>}
    <h2>Season totals</h2>
    <Table><TableHeader><TableRow><TableHead>Season</TableHead><TableHead>Picks</TableHead><TableHead>W–L–P</TableHead><TableHead>Win rate</TableHead><TableHead>Pending</TableHead></TableRow></TableHeader><TableBody>{data.seasons.map((row) => <TableRow key={row.season}><TableCell>{row.season}</TableCell><TableCell>{row.picks}</TableCell><TableCell>{record(row)}</TableCell><TableCell>{percentage(row.winRate)}</TableCell><TableCell>{row.pending}</TableCell></TableRow>)}</TableBody></Table>
    <h2>Saved pick log</h2>
    <Table><TableHeader><TableRow>{["Season / week", "Matchup", "Saved pick", "ATS result"].map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{data.rows.map((row) => <TableRow key={`${row.season}-${row.game_id}`}><TableCell>{row.season} / {row.week}</TableCell><TableCell>{row.away} @ {row.home}</TableCell><TableCell>{savedSide(row)}</TableCell><TableCell>{row.pick === "HOME" || row.pick === "AWAY" ? row.result_ats || "Pending" : "Not a pick"}</TableCell></TableRow>)}</TableBody></Table>
    <div className="tracking-notice"><strong>How this stays up to date</strong><p>Thursday’s picks are saved in the project. Tuesday’s update grades them and refreshes these totals. The website then needs to be republished; it does not currently update itself.</p><p>Pinnacle CLV uses captured near-close quotes. Missing quotes stay blank.</p><small>Snapshot exported {new Date(generatedAt).toLocaleString("en-US", { timeZone: "America/New_York" })} ET · Source: {data.source}</small></div>
  </section>;
}
