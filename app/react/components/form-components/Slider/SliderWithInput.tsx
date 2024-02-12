import { Input } from '../Input';

import { Slider } from './Slider';

export function SliderWithInput({
  value,
  onChange,
  max,
  min = 0,
  step = 1,
  dataCy,
  visibleTooltip = false,
}: {
  value: number;
  onChange: (value: number) => void;
  max: number;
  min?: number;
  dataCy: string;
  step?: number;
  visibleTooltip?: boolean;
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
            min={min}
            max={max}
            step={step}
            dataCy={`${dataCy}Slider`}
            visibleTooltip={visibleTooltip}
          />
        </div>
      )}
      <Input
        type="number"
        min="0"
        max={max}
        value={value}
        onChange={({ target: { valueAsNumber: value } }) =>
          onChange(Number.isNaN(value) ? 0 : value)
        }
        className="w-32"
        data-cy={`${dataCy}Input`}
      />
    </div>
  );
}
