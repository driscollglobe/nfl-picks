export type RangeSetting = {
  min: number;
  max: number;
  step: number;
};

export type ModelDefaults = {
  epaWeight: number;
  elwayWeight: number;
  homeFieldPoints: number;
  restPointsPerExtraDay: number;
  restAdvantageCapPoints: number;
  byeWeekPoints: number;
  byeMinimumRestDays: number;
  westCoastEarlyPoints: number;
  earlyKickoffTimeEt: string;
  westCoastTeams: string[];
  qbertRatingPointsPerSpreadPoint: number;
  quarterbackAdjustmentScale: number;
  pickEdgeThresholdPoints: number;
  spreadRoundingPoints: number;
  breakEvenRate: number;
};

export type ControlRanges = {
  pick_edge_threshold_points: RangeSetting;
  epa_weight: RangeSetting;
  home_field_points: RangeSetting;
  rest_points_per_extra_day: RangeSetting;
  bye_week_points: RangeSetting;
  west_coast_early_points: RangeSetting;
  quarterback_adjustment_scale: RangeSetting;
};

export type Game = {
  game_id: string;
  season: number;
  week: number;
  kickoff: string;
  gameday: string;
  gametime: string;
  away_team: string;
  home_team: string;
  location: string;
  away_score: number | null;
  home_score: number | null;
  away_rest: number | null;
  home_rest: number | null;
  away_epa_rating: number;
  home_epa_rating: number;
  away_external_rating: number | null;
  home_external_rating: number | null;
  elway_spread_internal: number | null;
  elway_total: number | null;
  home_win_prob: number | null;
  market_spread: number | null;
  market_total: number | null;
  market_spread_at_pick: number | null;
  closing_spread: number | null;
  result_ats: string | null;
  clv: number | null;
  model_spread: number;
  model_total: number | null;
  edge: number | null;
  pick: string;
  pick_reason: string;
  agree_with_elway: boolean | null;
  odds_provider: string | null;
  stadium: string | null;
  roof_type: string | null;
  temperature: number | null;
  temperature_unit: string | null;
  wind_speed_mph: number | null;
  wind_direction: string | null;
  precip_probability_pct: number | null;
  short_forecast: string | null;
  weather_total_reduction: number;
  weather_status: string | null;
  home_qb_expected_qb: string | null;
  home_qb_observed_qb: string | null;
  home_qb_qb_points_adjustment: number;
  home_qb_qb_adjustment_status: string | null;
  away_qb_expected_qb: string | null;
  away_qb_observed_qb: string | null;
  away_qb_qb_points_adjustment: number;
  away_qb_qb_adjustment_status: string | null;
  source_warnings: string | null;
};

export type Rating = {
  season: number;
  week: number;
  team: string;
  epa_offense_rating: number;
  epa_defense_rating: number;
  epa_rating: number;
  games_played: number;
  external_rating: number | null;
  final_rating: number;
  rating_source: string;
};

export type BacktestRow = {
  sample: string;
  minimum_edge: number;
  games: number;
  wins: number;
  losses: number;
  pushes: number;
  win_rate: number;
  beats_break_even: boolean;
};

export type DashboardData = {
  tracking: import("@/components/tracking-panel").TrackingData;
  generatedAt: string;
  season: number;
  week: number;
  defaults: ModelDefaults;
  controlRanges: ControlRanges;
  games: Game[];
  ratings: Rating[];
  backtest: BacktestRow[];
  warnings: string[];
  source: string;
};

export type ModelSettings = {
  threshold: number;
  epaWeight: number;
  homeFieldPoints: number;
  restPointsPerExtraDay: number;
  byeWeekPoints: number;
  westCoastEarlyPoints: number;
  quarterbackAdjustmentScale: number;
};

export type EvaluatedGame = Game & {
  modelSpreadRaw: number;
  modelSpread: number;
  modelEdge: number | null;
  edge: number | null;
  decision: "HOME" | "AWAY" | "PASS" | "LOCKED";
  selectedTeam: string | null;
  selectedLine: number | null;
  agrees: boolean | null;
  adjustments: {
    homeField: number;
    rest: number;
    bye: number;
    westEarly: number;
    quarterback: number;
  };
};

export function defaultSettings(defaults: ModelDefaults): ModelSettings {
  return {
    threshold: defaults.pickEdgeThresholdPoints,
    epaWeight: defaults.epaWeight,
    homeFieldPoints: defaults.homeFieldPoints,
    restPointsPerExtraDay: defaults.restPointsPerExtraDay,
    byeWeekPoints: defaults.byeWeekPoints,
    westCoastEarlyPoints: defaults.westCoastEarlyPoints,
    quarterbackAdjustmentScale: defaults.quarterbackAdjustmentScale,
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function blendRating(
  epa: number,
  external: number | null,
  epaWeight: number,
): number {
  if (external === null || !Number.isFinite(external)) return epa;
  return epaWeight * epa + (1 - epaWeight) * external;
}

function roundSpread(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

export function evaluateGame(
  game: Game,
  settings: ModelSettings,
  defaults: ModelDefaults,
): EvaluatedGame {
  const homeRating = blendRating(
    game.home_epa_rating,
    game.home_external_rating,
    settings.epaWeight,
  );
  const awayRating = blendRating(
    game.away_epa_rating,
    game.away_external_rating,
    settings.epaWeight,
  );
  const homeField = game.location === "Neutral" ? 0 : settings.homeFieldPoints;
  let rest = 0;
  let bye = 0;
  if (game.home_rest !== null && game.away_rest !== null) {
    rest = clamp(
      (game.home_rest - game.away_rest) * settings.restPointsPerExtraDay,
      -defaults.restAdvantageCapPoints,
      defaults.restAdvantageCapPoints,
    );
    if (
      game.home_rest >= defaults.byeMinimumRestDays &&
      game.away_rest < defaults.byeMinimumRestDays
    ) {
      bye = settings.byeWeekPoints;
    } else if (
      game.away_rest >= defaults.byeMinimumRestDays &&
      game.home_rest < defaults.byeMinimumRestDays
    ) {
      bye = -settings.byeWeekPoints;
    }
  }
  const westEarly =
    defaults.westCoastTeams.includes(game.away_team) &&
    game.gametime === defaults.earlyKickoffTimeEt
      ? settings.westCoastEarlyPoints
      : 0;
  const quarterback =
    (game.home_qb_qb_points_adjustment -
      game.away_qb_qb_points_adjustment) *
    settings.quarterbackAdjustmentScale;
  const modelSpreadRaw =
    homeRating -
    awayRating +
    homeField +
    rest +
    bye +
    westEarly +
    quarterback;
  const modelSpread = roundSpread(
    modelSpreadRaw,
    defaults.spreadRoundingPoints,
  );
  const market = game.market_spread_at_pick;

  if (game.pick === "LOCKED") {
    return {
      ...game,
      modelSpreadRaw,
      modelSpread,
      modelEdge: null,
      edge: null,
      decision: "LOCKED",
      selectedTeam: null,
      selectedLine: null,
      agrees: null,
      adjustments: { homeField, rest, bye, westEarly, quarterback },
    };
  }
  if (market === null) {
    return {
      ...game,
      modelSpreadRaw,
      modelSpread,
      modelEdge: null,
      edge: null,
      decision: "PASS",
      selectedTeam: null,
      selectedLine: null,
      agrees: null,
      adjustments: { homeField, rest, bye, westEarly, quarterback },
    };
  }

  const modelEdge = modelSpreadRaw - market;
  const edge = Math.abs(modelEdge);
  const side = modelEdge > 0 ? "HOME" : "AWAY";
  const elwayEdge =
    game.elway_spread_internal === null
      ? null
      : game.elway_spread_internal - market;
  return {
    ...game,
    modelSpreadRaw,
    modelSpread,
    modelEdge,
    edge,
    decision: edge >= settings.threshold ? side : "PASS",
    selectedTeam: side === "HOME" ? game.home_team : game.away_team,
    selectedLine: side === "HOME" ? -market : market,
    agrees:
      elwayEdge === null || modelEdge === 0 || elwayEdge === 0
        ? null
        : Math.sign(modelEdge) === Math.sign(elwayEdge),
    adjustments: { homeField, rest, bye, westEarly, quarterback },
  };
}

export function blendedRatings(
  ratings: Rating[],
  epaWeight: number,
): Array<Rating & { blendedRating: number }> {
  return ratings
    .map((rating) => ({
      ...rating,
      blendedRating: blendRating(
        rating.epa_rating,
        rating.external_rating,
        epaWeight,
      ),
    }))
    .sort((a, b) => b.blendedRating - a.blendedRating || a.team.localeCompare(b.team));
}

export function signed(value: number, digits = 1): string {
  const normalized = Math.abs(value) < 10 ** -(digits + 1) ? 0 : value;
  return `${normalized > 0 ? "+" : ""}${normalized.toFixed(digits)}`;
}

export function favorite(home: string, away: string, margin: number): string {
  if (Math.abs(margin) < 0.05) return "Pick’em";
  return margin > 0
    ? `${home} -${Math.abs(margin).toFixed(1)}`
    : `${away} -${Math.abs(margin).toFixed(1)}`;
}

export function kickoffLabel(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(new Date(value));
}
