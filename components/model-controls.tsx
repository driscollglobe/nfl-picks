import { RotateCcw, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  ControlRanges,
  ModelDefaults,
  ModelSettings,
} from "@/lib/model";
import { ModelSlider } from "@/components/model-slider";

type ModelControlsProps = {
  settings: ModelSettings;
  defaults: ModelDefaults;
  ranges: ControlRanges;
  onChange: (patch: Partial<ModelSettings>) => void;
  onReset: () => void;
};

export function ModelControls({
  settings,
  defaults,
  ranges,
  onChange,
  onReset,
}: ModelControlsProps) {
  return (
    <aside className="h-fit border border-white/10 bg-[#0c1915] xl:sticky xl:top-5">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal size={16} className="text-[#a9ff62]" />
          Model settings
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="rounded-none px-2 text-[#84938b] hover:bg-white/5 hover:text-white"
        >
          <RotateCcw data-icon="inline-start" /> Reset
        </Button>
      </div>

      <div className="space-y-5 p-5">
        <ModelSlider
          id="minimum-edge"
          label="Minimum edge"
          value={settings.threshold}
          range={ranges.pick_edge_threshold_points}
          displayValue={`${settings.threshold.toFixed(1)} pts`}
          help="Games at or above this gap become picks; the rest stay logged as passes."
          onChange={(threshold) => onChange({ threshold })}
        />
        <ModelSlider
          id="epa-weight"
          label="EPA share"
          value={settings.epaWeight}
          range={ranges.epa_weight}
          displayValue={`${Math.round(settings.epaWeight * 100)}%`}
          help={`${Math.round(settings.epaWeight * 100)}% EPA / ${Math.round((1 - settings.epaWeight) * 100)}% ELWAY.`}
          onChange={(epaWeight) => onChange({ epaWeight })}
        />
        <ModelSlider
          id="home-field"
          label="Home field"
          value={settings.homeFieldPoints}
          range={ranges.home_field_points}
          displayValue={`${settings.homeFieldPoints.toFixed(2)} pts`}
          help="Added to the home team for non-neutral games."
          onChange={(homeFieldPoints) => onChange({ homeFieldPoints })}
        />
        <ModelSlider
          id="rest-value"
          label="Rest per extra day"
          value={settings.restPointsPerExtraDay}
          range={ranges.rest_points_per_extra_day}
          displayValue={`${settings.restPointsPerExtraDay.toFixed(2)} pts`}
          help={`Capped at ${defaults.restAdvantageCapPoints.toFixed(1)} points in either direction.`}
          onChange={(restPointsPerExtraDay) =>
            onChange({ restPointsPerExtraDay })
          }
        />
        <ModelSlider
          id="bye-value"
          label="Bye-week boost"
          value={settings.byeWeekPoints}
          range={ranges.bye_week_points}
          displayValue={`${settings.byeWeekPoints.toFixed(2)} pts`}
          help={`Applied when one team has at least ${defaults.byeMinimumRestDays} days of rest.`}
          onChange={(byeWeekPoints) => onChange({ byeWeekPoints })}
        />
        <ModelSlider
          id="west-early-value"
          label="West → early game"
          value={settings.westCoastEarlyPoints}
          range={ranges.west_coast_early_points}
          displayValue={`${settings.westCoastEarlyPoints.toFixed(2)} pts`}
          help="Credits the home side when a West Coast visitor plays at 1 p.m. ET."
          onChange={(westCoastEarlyPoints) =>
            onChange({ westCoastEarlyPoints })
          }
        />
        <ModelSlider
          id="quarterback-value"
          label="QB adjustment scale"
          value={settings.quarterbackAdjustmentScale}
          range={ranges.quarterback_adjustment_scale}
          displayValue={`${settings.quarterbackAdjustmentScale.toFixed(2)}×`}
          help="Scales any validated starter-to-backup QBERT change."
          onChange={(quarterbackAdjustmentScale) =>
            onChange({ quarterbackAdjustmentScale })
          }
        />
      </div>

      <div className="border-t border-[#ffb86b]/20 bg-[#ffb86b]/[0.04] px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#ffb86b]">
          Week 1 context
        </p>
        <p className="mt-1.5 text-xs leading-5 text-[#9eaaa4]">
          EPA still equals the preseason ELWAY prior, and rest, bye, and QB inputs
          are all neutral. Those controls begin separating games as the season
          develops.
        </p>
      </div>
    </aside>
  );
}
