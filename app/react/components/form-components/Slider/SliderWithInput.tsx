import { Input } from '../Input';

import { Slider } from './Slider';

export function SliderWithInput({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (value: number) => void;
  max: number;
}) {
  return (
    <div className="flex items-center gap-4">
      {max && (
        <div className="mr-2 flex-1">
          <Slider
            onChange={(value) =>
              onChange(typeof value === 'number' ? value : value[0])
            }
            value={value}
            min={0}
            max={max}
            step={256}
          />
        </div>
      )}
      <Input
        type="number"
        min="0"
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.valueAsNumber)}
        className="w-32"
      />
    </div>
  );
}
