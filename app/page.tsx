"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  GitBranch,
  Radio,
  ShieldCheck,
  Trophy,
} from "lucide-react";

import { BacktestPanel } from "@/components/backtest-panel";
import { GameBoard } from "@/components/game-board";
import { Methodology } from "@/components/methodology";
import { ModelControls } from "@/components/model-controls";
import { RatingsTable } from "@/components/ratings-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  defaultSettings,
  evaluateGame,
  type DashboardData,
  type ModelSettings,
} from "@/lib/model";
import modelData from "@/lib/model-data.json";

type ViewName = "board" | "ratings" | "backtest" | "method";

type ToolDefinition = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: {
    readOnlyHint: boolean;
    untrustedContentHint: boolean;
  };
  execute: (input: unknown) => unknown;
};

declare global {
  interface Document {
    readonly modelContext?: {
      registerTool: (
        tool: ToolDefinition,
        options?: { signal?: AbortSignal },
      ) => void | Promise<void>;
    };
  }
}

const dashboard = modelData as unknown as DashboardData;
const startingSettings = defaultSettings(dashboard.defaults);

function settingRange(key: keyof ModelSettings) {
  const mapping = {
    threshold: dashboard.controlRanges.pick_edge_threshold_points,
    epaWeight: dashboard.controlRanges.epa_weight,
    homeFieldPoints: dashboard.controlRanges.home_field_points,
    restPointsPerExtraDay:
      dashboard.controlRanges.rest_points_per_extra_day,
    byeWeekPoints: dashboard.controlRanges.bye_week_points,
    westCoastEarlyPoints: dashboard.controlRanges.west_coast_early_points,
    quarterbackAdjustmentScale:
      dashboard.controlRanges.quarterback_adjustment_scale,
  };
  return mapping[key];
}

function validateToolInput(input: unknown): Partial<ModelSettings> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Model settings must be supplied as an object.");
  }
  const allowed = new Set<keyof ModelSettings>([
    "threshold",
    "epaWeight",
    "homeFieldPoints",
    "restPointsPerExtraDay",
    "byeWeekPoints",
    "westCoastEarlyPoints",
    "quarterbackAdjustmentScale",
  ]);
  const entries = Object.entries(input as Record<string, unknown>);
  if (entries.length === 0) {
    throw new Error("Supply at least one model setting to change.");
  }
  const patch: Partial<ModelSettings> = {};
  for (const [rawKey, rawValue] of entries) {
    const key = rawKey as keyof ModelSettings;
    if (!allowed.has(key)) throw new Error(`Unknown model setting: ${rawKey}`);
    if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
      throw new Error(`${rawKey} must be a finite number.`);
    }
    const range = settingRange(key);
    if (rawValue < range.min || rawValue > range.max) {
      throw new Error(
        `${rawKey} must be between ${range.min} and ${range.max}.`,
      );
    }
    patch[key] = rawValue;
  }
  return patch;
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export default function Home() {
  const [settings, setSettings] = useState<ModelSettings>(startingSettings);
  const [activeView, setActiveView] = useState<ViewName>("board");
  const settingsRef = useRef(settings);

  const updateSettings = useCallback((patch: Partial<ModelSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      settingsRef.current = next;
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    settingsRef.current = startingSettings;
    setSettings(startingSettings);
  }, []);

  const evaluatedGames = useMemo(
    () =>
      dashboard.games.map((game) =>
        evaluateGame(game, settings, dashboard.defaults),
      ),
    [settings],
  );

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const properties = Object.fromEntries(
      (
        [
          ["threshold", "Minimum points of edge required to make a pick."],
          ["epaWeight", "EPA share of the EPA/ELWAY rating blend."],
          ["homeFieldPoints", "Points awarded for non-neutral home field."],
          ["restPointsPerExtraDay", "Points per extra rest day before the cap."],
          ["byeWeekPoints", "Additional points for a qualifying bye week."],
          ["westCoastEarlyPoints", "Home credit for West-to-1pm-ET travel."],
          [
            "quarterbackAdjustmentScale",
            "Multiplier on validated QBERT starter-to-backup adjustments.",
          ],
        ] as const
      ).map(([key, description]) => {
        const range = settingRange(key);
        return [
          key,
          {
            type: "number",
            minimum: range.min,
            maximum: range.max,
            description,
          },
        ];
      }),
    );

    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: "configure_nfl_model_board",
            title: "Configure NFL model board",
            description:
              "Apply one or more hypothetical model settings to the visible NFL Picks Lab and return the resulting playable picks. This changes only the browser scenario, not picks.csv.",
            inputSchema: {
              type: "object",
              properties,
              minProperties: 1,
              additionalProperties: false,
            },
            annotations: {
              readOnlyHint: false,
              untrustedContentHint: false,
            },
            async execute(input) {
              const patch = validateToolInput(input);
              const next = { ...settingsRef.current, ...patch };
              settingsRef.current = next;
              setSettings(next);
              setActiveView("board");
              await nextPaint();
              const nextGames = dashboard.games.map((game) =>
                evaluateGame(game, next, dashboard.defaults),
              );
              const picks = nextGames
                .filter(
                  (game) =>
                    game.decision === "HOME" || game.decision === "AWAY",
                )
                .sort((a, b) => (b.edge ?? 0) - (a.edge ?? 0))
                .map((game) => ({
                  gameId: game.game_id,
                  team: game.selectedTeam,
                  line: game.selectedLine,
                  edge: Number((game.edge ?? 0).toFixed(2)),
                  agreesWithElway: game.agrees,
                }));
              return {
                status: "configured",
                settings: next,
                playableGames: picks.length,
                picks,
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => undefined);
    } catch {
      return;
    }
    return () => lifecycle.abort();
  }, []);

  const playable = evaluatedGames.filter(
    (game) => game.decision === "HOME" || game.decision === "AWAY",
  );
  const topEdge = playable.reduce(
    (maximum, game) => Math.max(maximum, game.edge ?? 0),
    0,
  );

  return (
    <main className="min-h-screen bg-[#07110e] text-[#f4f6ed]">
      <div className="border-b border-white/10 bg-[#0a1713] px-5 py-2 text-[10px] uppercase tracking-[0.16em] text-[#8ea097] sm:px-8 sm:text-[11px]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
          <span>{dashboard.season} season / live model desk</span>
          <span className="flex items-center gap-2 text-[#a9ff62]">
            <Radio size={11} /> Week {dashboard.week} board · {dashboard.games.length}{" "}
            games logged
          </span>
        </div>
      </div>

      <Tabs
        value={activeView}
        onValueChange={(value) => setActiveView(value as ViewName)}
        className="mx-auto max-w-[1440px] px-5 pb-16 pt-7 sm:px-8"
      >
        <header className="mb-6 border-b border-white/10 pb-6">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-[#a9ff62]">
                <Activity size={14} /> Against the spread
              </div>
              <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                NFL Picks Lab
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#93a39b] sm:text-base">
                Stress-test the weekly board, inspect every input, and keep the
                model’s losing backtest in plain sight.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-px border border-white/10 bg-white/10 font-mono text-[10px] uppercase tracking-[0.1em] text-[#93a39b]">
              <div className="bg-[#0c1915] px-3 py-2.5">
                <span className="block text-[#526159]">Picks</span>
                <strong className="mt-0.5 block text-base text-[#f4f6ed]">
                  {playable.length}
                </strong>
              </div>
              <div className="bg-[#0c1915] px-3 py-2.5">
                <span className="block text-[#526159]">Top edge</span>
                <strong className="mt-0.5 block text-base text-[#a9ff62]">
                  {topEdge.toFixed(1)}
                </strong>
              </div>
              <div className="bg-[#0c1915] px-3 py-2.5">
                <span className="block text-[#526159]">Blend</span>
                <strong className="mt-0.5 block text-base text-[#f4f6ed]">
                  {Math.round(settings.epaWeight * 100)}/{Math.round((1 - settings.epaWeight) * 100)}
                </strong>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <TabsList
              variant="line"
              aria-label="Dashboard views"
              className="h-auto w-full justify-start gap-6 overflow-x-auto rounded-none p-0 md:w-auto"
            >
              <TabsTrigger
                value="board"
                className="h-auto flex-none rounded-none px-0 pb-2 font-mono text-[11px] uppercase tracking-[0.11em] text-[#718078] data-active:text-[#a9ff62] after:bg-[#a9ff62]"
              >
                <Activity data-icon="inline-start" /> Model Lab
              </TabsTrigger>
              <TabsTrigger
                value="ratings"
                className="h-auto flex-none rounded-none px-0 pb-2 font-mono text-[11px] uppercase tracking-[0.11em] text-[#718078] data-active:text-[#a9ff62] after:bg-[#a9ff62]"
              >
                <Trophy data-icon="inline-start" /> Ratings
              </TabsTrigger>
              <TabsTrigger
                value="backtest"
                className="h-auto flex-none rounded-none px-0 pb-2 font-mono text-[11px] uppercase tracking-[0.11em] text-[#718078] data-active:text-[#a9ff62] after:bg-[#a9ff62]"
              >
                <BarChart3 data-icon="inline-start" /> Backtest
              </TabsTrigger>
              <TabsTrigger
                value="method"
                className="h-auto flex-none rounded-none px-0 pb-2 font-mono text-[11px] uppercase tracking-[0.11em] text-[#718078] data-active:text-[#a9ff62] after:bg-[#a9ff62]"
              >
                <BookOpen data-icon="inline-start" /> How it works
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.1em] text-[#718078]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-[#a9ff62]" /> Private preview
              </span>
              <span className="h-3 w-px bg-white/10" />
              <span className="inline-flex items-center gap-1.5">
                <GitBranch size={13} /> driscollglobe repo target
              </span>
            </div>
          </div>
        </header>

        <TabsContent value="board">
          <section className="grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)]">
            <ModelControls
              settings={settings}
              defaults={dashboard.defaults}
              ranges={dashboard.controlRanges}
              onChange={updateSettings}
              onReset={resetSettings}
            />
            <GameBoard games={evaluatedGames} threshold={settings.threshold} />
          </section>
        </TabsContent>

        <TabsContent value="ratings">
          <RatingsTable
            ratings={dashboard.ratings}
            epaWeight={settings.epaWeight}
          />
        </TabsContent>

        <TabsContent value="backtest">
          <BacktestPanel
            rows={dashboard.backtest}
            breakEvenRate={dashboard.defaults.breakEvenRate}
            selectedThreshold={settings.threshold}
            onSelectThreshold={(threshold) => updateSettings({ threshold })}
          />
        </TabsContent>

        <TabsContent value="method">
          <Methodology
            generatedAt={dashboard.generatedAt}
            source={dashboard.source}
            warnings={dashboard.warnings}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
