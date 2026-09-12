"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Activity,
  BarChart3,
  BookOpen,
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
    <main className="driscoll-app">
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as ViewName)} className="app-frame">
        <header className="app-topbar">
          <div className="app-brand">
            <Image src="/driscoll-logo.png" alt="Driscoll bulldog" width={48} height={48} unoptimized priority />
            <div><strong>Driscoll<span> / NFL</span></strong><p>Model workspace</p></div>
          </div>
          <TabsList variant="line" aria-label="Dashboard views" className="app-navigation">
            <TabsTrigger value="board"><Activity size={16} />Game board</TabsTrigger>
            <TabsTrigger value="ratings"><Trophy size={16} />Ratings</TabsTrigger>
            <TabsTrigger value="backtest"><BarChart3 size={16} />Backtest</TabsTrigger>
            <TabsTrigger value="method"><BookOpen size={16} />Method</TabsTrigger>
          </TabsList>
          <span className="private-label"><ShieldCheck size={14} />Private workspace</span>
        </header>
        <div className="app-content">
          <div className="workspace-heading">
            <div><div className="season-label"><span />{dashboard.season} season / Week {dashboard.week}</div>
            <h1>{activeView === "board" ? "The game board" : activeView === "ratings" ? "Power ratings" : activeView === "backtest" ? "The track record" : "Inside the model"}</h1>
            <p>{activeView === "board" ? "Find the gap between your model and the market." : "Every assumption, input, and result in the open."}</p></div>
            <div className="quick-stats"><div><span>Qualifying picks</span><strong>{playable.length}<small> / {dashboard.games.length}</small></strong></div><div><span>Largest edge</span><strong>{topEdge.toFixed(1)}<small> pts</small></strong></div></div>
          </div>
          <TabsContent value="board">
            <section className="model-workspace">
              <GameBoard games={evaluatedGames} threshold={settings.threshold} />
              <div className="tuning-panel"><ModelControls settings={settings} defaults={dashboard.defaults} ranges={dashboard.controlRanges} onChange={updateSettings} onReset={resetSettings} /></div>
            </section>
          </TabsContent>
          <TabsContent value="ratings"><RatingsTable ratings={dashboard.ratings} epaWeight={settings.epaWeight} /></TabsContent>
          <TabsContent value="backtest"><BacktestPanel rows={dashboard.backtest} breakEvenRate={dashboard.defaults.breakEvenRate} selectedThreshold={settings.threshold} onSelectThreshold={(threshold) => updateSettings({ threshold })} /></TabsContent>
          <TabsContent value="method"><Methodology generatedAt={dashboard.generatedAt} source={dashboard.source} warnings={dashboard.warnings} /></TabsContent>
          <footer className="app-footer"><span>DRISCOLL NFL MODEL</span><span>Exploration only · Changes here do not alter your saved picks.</span></footer>
        </div>
      </Tabs>
    </main>
  );
}
