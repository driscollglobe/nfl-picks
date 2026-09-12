"use client";

import { useState } from "react";
import { Check, CloudSun, LockKeyhole, Minus } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import type { EvaluatedGame } from "@/lib/model";
import { favorite, kickoffLabel, signed } from "@/lib/model";

type BoardFilter = "picks" | "all" | "passes";

type GameBoardProps = {
  games: EvaluatedGame[];
  threshold: number;
};

function weatherLabel(game: EvaluatedGame): string {
  if (game.roof_type && game.roof_type !== "outdoor") return "Indoor / covered";
  const pieces = [
    game.short_forecast,
    game.temperature === null
      ? null
      : `${Math.round(game.temperature)}°${game.temperature_unit ?? "F"}`,
    game.wind_speed_mph === null
      ? null
      : `${game.wind_speed_mph.toFixed(0)} mph ${game.wind_direction ?? ""}`.trim(),
  ].filter(Boolean);
  return pieces.length ? pieces.join(" · ") : "Weather unavailable";
}

function callBadge(game: EvaluatedGame) {
  const isPick = game.decision === "HOME" || game.decision === "AWAY";
  if (isPick) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-[#a9ff62] px-2.5 py-1.5 font-mono text-xs font-bold text-[#07110e]">
        <Check size={13} strokeWidth={3} /> {game.selectedTeam}{" "}
        {signed(game.selectedLine ?? 0)}
      </span>
    );
  }
  if (game.decision === "LOCKED") {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[#77877f]">
        <LockKeyhole size={13} /> Locked
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[#77877f]">
      <Minus size={13} /> Pass
    </span>
  );
}

export function GameBoard({ games, threshold }: GameBoardProps) {
  const [filter, setFilter] = useState<BoardFilter>("picks");
  const actionable = games.filter(
    (game) => game.decision === "HOME" || game.decision === "AWAY",
  );
  const agreementCount = actionable.filter((game) => game.agrees).length;
  const passCount = games.filter((game) => game.decision === "PASS").length;

  const visible = (() => {
    const selected = games.filter((game) => {
      if (filter === "picks") {
        return game.decision === "HOME" || game.decision === "AWAY";
      }
      if (filter === "passes") return game.decision === "PASS";
      return true;
    });
    return [...selected].sort((a, b) => {
      if (filter === "picks") return (b.edge ?? -1) - (a.edge ?? -1);
      return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
    });
  })();

  return (
    <div>
      <div className="game-board-stats mb-6 grid grid-cols-2 gap-px border border-white/10 bg-white/10 lg:grid-cols-4">
        {[
          ["Playable", actionable.length.toString()],
          ["ELWAY agrees", `${agreementCount}/${actionable.length}`],
          ["Passes", passCount.toString()],
          ["Cutoff", `${threshold.toFixed(1)} pts`],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#0c1915] px-4 py-4 sm:px-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#67776f]">
              {label}
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      <div className="board-toolbar mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Matchups
          </h2>
          <p className="mt-1 text-xs text-[#718078]">
            {agreementCount} picks agree with ELWAY · {passCount} passes · Open a matchup for details
          </p>
        </div>
        <ButtonGroup aria-label="Filter games">
          {(
            [
              ["picks", "Picks"],
              ["all", "All games"],
              ["passes", "Passes"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant="outline"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`rounded-none border-white/10 bg-[#0c1915] text-[#95a39c] hover:bg-white/5 hover:text-white ${
                filter === value
                  ? "border-[#a9ff62]/50 bg-[#a9ff62]/10 text-[#a9ff62]"
                  : ""
              }`}
            >
              {label}
            </Button>
          ))}
        </ButtonGroup>
      </div>

      {visible.length === 0 ? (
        <div className="border border-white/10 bg-[#0c1915] px-6 py-14 text-center">
          <p className="text-sm text-[#93a39b]">
            No games clear a {threshold.toFixed(1)}-point edge.
          </p>
          <Button
            type="button"
            variant="link"
            onClick={() => setFilter("all")}
            className="mt-2 text-[#a9ff62]"
          >
            View the full board
          </Button>
        </div>
      ) : (
        <div className="game-board-shell border border-white/10">
          <div className="hidden grid-cols-[1.35fr_.8fr_.8fr_.65fr_.75fr_18px] gap-4 border-b border-white/10 bg-[#0a1713] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#67776f] md:grid">
            <span>Matchup</span>
            <span>Model</span>
            <span>Market</span>
            <span>Edge</span>
            <span className="text-right">Call</span>
            <span />
          </div>
          <Accordion multiple>
            {visible.map((game) => {
              const isPick =
                game.decision === "HOME" || game.decision === "AWAY";
              const finished =
                game.home_score !== null && game.away_score !== null;
              return (
                <AccordionItem
                  key={game.game_id}
                  value={game.game_id}
                  className="border-white/10 bg-[#0c1915]"
                >
                  <AccordionTrigger className="rounded-none px-5 py-0 hover:no-underline focus-visible:border-[#a9ff62]/40 focus-visible:ring-[#a9ff62]/20">
                    <div className="grid w-full gap-4 py-5 text-left md:grid-cols-[1.35fr_.8fr_.8fr_.65fr_.75fr] md:items-center">
                      <div>
                        <p className="text-base font-semibold tracking-tight text-[#f4f6ed]">
                          {game.away_team}
                          <span className="mx-2 font-normal text-[#526159]">@</span>
                          {game.home_team}
                        </p>
                        <p className="mt-1 font-mono text-[10px] text-[#77877f]">
                          {kickoffLabel(game.kickoff)} ET
                          {finished
                            ? ` · FINAL ${game.away_score}–${game.home_score}`
                            : ""}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#67776f] md:hidden">
                          Model
                        </p>
                        <p className="mt-1 font-mono text-sm text-[#e7ebe4]">
                          {favorite(
                            game.home_team,
                            game.away_team,
                            game.modelSpread,
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#67776f] md:hidden">
                          Market
                        </p>
                        <p className="mt-1 font-mono text-sm text-[#e7ebe4]">
                          {game.market_spread_at_pick === null
                            ? "Closed"
                            : favorite(
                                game.home_team,
                                game.away_team,
                                game.market_spread_at_pick,
                              )}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#67776f] md:hidden">
                          Edge
                        </p>
                        <p
                          className={`mt-1 font-mono text-sm ${
                            isPick ? "text-[#a9ff62]" : "text-[#829189]"
                          }`}
                        >
                          {game.edge === null
                            ? "—"
                            : `${game.edge.toFixed(1)} pts`}
                        </p>
                      </div>
                      <div className="md:text-right">
                        {callBadge(game)}
                        {isPick && game.agrees && (
                          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#829189]">
                            ELWAY agrees
                          </p>
                        )}
                        {game.result_ats && (
                          <p className="mt-1.5 font-mono text-[10px] text-[#c7d0ca]">
                            Result: {game.result_ats}
                          </p>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="border-t border-white/8 px-5 py-4">
                    <div className="grid gap-px bg-white/8 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="bg-[#0a1713] p-4">
                        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#67776f]">
                          ELWAY view
                        </p>
                        <p className="mt-2 font-mono text-sm text-[#d8dfda]">
                          {game.elway_spread_internal === null
                            ? "Unavailable"
                            : favorite(
                                game.home_team,
                                game.away_team,
                                game.elway_spread_internal,
                              )}
                        </p>
                        <p className="mt-1 text-[11px] text-[#718078]">
                          {game.home_win_prob === null
                            ? "No win probability"
                            : `${game.home_win_prob.toFixed(1)}% home win`}
                        </p>
                      </div>
                      <div className="bg-[#0a1713] p-4">
                        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#67776f]">
                          Total + weather
                        </p>
                        <p className="mt-2 flex items-center gap-2 font-mono text-sm text-[#d8dfda]">
                          <CloudSun size={14} className="text-[#8ea097]" />
                          {game.model_total === null
                            ? "No total"
                            : game.model_total.toFixed(1)}
                        </p>
                        <p className="mt-1 text-[11px] leading-4 text-[#718078]">
                          {weatherLabel(game)}
                        </p>
                      </div>
                      <div className="bg-[#0a1713] p-4">
                        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#67776f]">
                          Quarterbacks
                        </p>
                        <p className="mt-2 text-xs text-[#d8dfda]">
                          {game.away_team}: {game.away_qb_observed_qb ?? "Unknown"}
                        </p>
                        <p className="mt-1 text-xs text-[#d8dfda]">
                          {game.home_team}: {game.home_qb_observed_qb ?? "Unknown"}
                        </p>
                        <p className="mt-1 text-[11px] text-[#718078]">
                          Net {signed(game.adjustments.quarterback)} pts
                        </p>
                      </div>
                      <div className="bg-[#0a1713] p-4">
                        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#67776f]">
                          Spread adjustments
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px] text-[#9eaaa4]">
                          <span>Home</span>
                          <span className="text-right">
                            {signed(game.adjustments.homeField)}
                          </span>
                          <span>Rest / bye</span>
                          <span className="text-right">
                            {signed(game.adjustments.rest + game.adjustments.bye)}
                          </span>
                          <span>Travel</span>
                          <span className="text-right">
                            {signed(game.adjustments.westEarly)}
                          </span>
                          <span>QB</span>
                          <span className="text-right">
                            {signed(game.adjustments.quarterback)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-[10px] text-[#59675f]">
                      Line source: {game.odds_provider ?? "nflverse close"} · Game ID:{" "}
                      {game.game_id}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      )}
    </div>
  );
}
