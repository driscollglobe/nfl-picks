import Image from "next/image";

const TEAM_ASSETS: Record<string, string> = {
  ARI: "arizona-cardinals-v2", ATL: "atlanta-falcons", BAL: "baltimore-ravens",
  BUF: "buffalo-bills", CAR: "carolina-panthers", CHI: "chicago-bears",
  CIN: "cincinnati-bengals", CLE: "cleveland-browns", DAL: "dallas-cowboys",
  DEN: "denver-broncos", DET: "detroit-lions-v2", GB: "green-bay-packers",
  HOU: "houston-texans", IND: "indianapolis-colts", JAX: "jacksonville-jaguars",
  KC: "kansas-city-chiefs-v2", LV: "las-vegas-raiders", LAC: "los-angeles-chargers",
  LA: "los-angeles-rams", LAR: "los-angeles-rams", MIA: "miami-dolphins",
  MIN: "minnesota-vikings", NE: "new-england-patriots-v2", NO: "new-orleans-saints-v2",
  NYG: "new-york-giants-v2", NYJ: "new-york-jets", PHI: "philadelphia-eagles",
  PIT: "pittsburgh-steelers", SF: "san-francisco-49ers", SEA: "seattle-seahawks",
  TB: "tampa-bay-buccaneers", TEN: "tennessee-titans", WAS: "washington-commanders",
  JAC: "jacksonville-jaguars", OAK: "las-vegas-raiders", SD: "los-angeles-chargers",
  STL: "los-angeles-rams", WSH: "washington-commanders", NFL: "nfl",
};

/** Display a supplied logo without replacing the adjacent accessible team name. */
export function TeamLogo({ team, size = 28 }: { team: string; size?: number }) {
  const asset = TEAM_ASSETS[team.toUpperCase()];
  if (!asset) return null;
  return <Image src={`/team-logos/${asset}.png`} alt="" aria-hidden="true"
    width={size} height={size} unoptimized className="team-logo"
    style={{ width: size, height: size }} />;
}

/** Keep a team's mark and abbreviation together in tables and matchups. */
export function TeamLabel({ team, size = 28 }: { team: string; size?: number }) {
  return <span className="team-label"><TeamLogo team={team} size={size} /><span>{team}</span></span>;
}
