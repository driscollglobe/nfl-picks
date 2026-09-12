import { Slider } from "@/components/ui/slider";
import type { RangeSetting } from "@/lib/model";

type ModelSliderProps = {
  id: string;
  label: string;
  value: number;
  range: RangeSetting;
  displayValue: string;
  help: string;
  onChange: (value: number) => void;
};

export function ModelSlider({
  id,
  label,
  value,
  range,
  displayValue,
  help,
  onChange,
}: ModelSliderProps) {
  return (
    <div className="border-b border-white/8 pb-5 last:border-b-0 last:pb-0">
      <div className="flex items-end justify-between gap-4">
        <label htmlFor={id} className="text-sm text-[#c7d0ca]">
          {label}
        </label>
        <output
          htmlFor={id}
          className="font-mono text-base font-semibold text-[#a9ff62]"
        >
          {displayValue}
        </output>
      </div>
      <Slider
        id={id}
        value={[value]}
        min={range.min}
        max={range.max}
        step={range.step}
        onValueChange={(nextValue) => {
          const scalar = Array.isArray(nextValue) ? nextValue[0] : nextValue;
          onChange(Number(scalar));
        }}
        className="mt-3"
      />
      <div className="mt-1.5 flex justify-between font-mono text-[9px] text-[#526159]">
        <span>{range.min}</span>
        <span>{range.max}</span>
      </div>
      <p className="mt-1 text-[11px] leading-4 text-[#718078]">{help}</p>
    </div>
  );
}
