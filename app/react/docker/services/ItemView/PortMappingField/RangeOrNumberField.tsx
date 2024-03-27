import { InputLabeled } from '@@/form-components/Input/InputLabeled';
import { Checkbox } from '@@/form-components/Checkbox';

import { Range, isRange } from './types';

export function RangeOrNumberField({
  value,
  onChange,
  disabled,
  readOnly,
  id,
  label,
}: {
  value: Range | number | undefined;
  onChange: (value: Range | number | undefined) => void;
  disabled?: boolean;
  readOnly?: boolean;
  id: string;
  label: string;
}) {
  return (
    <div className="flex gap-2 items-center">
      <RangeCheckbox value={value} onChange={onChange} />
      {isRange(value) ? (
        <RangeInput
          value={value}
          onChange={onChange}
          label={label}
          disabled={disabled}
          readOnly={readOnly}
          id={id}
        />
      ) : (
        <InputLabeled
          size="small"
          placeholder="e.g. 80"
          className="w-1/2"
          label={label}
          disabled={disabled}
          readOnly={readOnly}
          id={id}
          value={value || ''}
          type="number"
          onChange={(e) => onChange(getNumber(e.target.valueAsNumber))}
        />
      )}
    </div>
  );
}

function RangeInput({
  value,
  onChange,
  disabled,
  readOnly,
  id,
  label,
}: {
  value: Range;
  onChange: (value: Range) => void;
  disabled?: boolean;
  readOnly?: boolean;
  id: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="font-normal m-0">{label}</label>
      <InputLabeled
        label="from"
        size="small"
        value={value.start || ''}
        onChange={(e) =>
          handleChange({ start: getNumber(e.target.valueAsNumber) })
        }
        disabled={disabled}
        readOnly={readOnly}
        id={id}
        type="number"
      />

      <InputLabeled
        label="to"
        size="small"
        value={value.end || ''}
        onChange={(e) =>
          handleChange({ end: getNumber(e.target.valueAsNumber) })
        }
        disabled={disabled}
        readOnly={readOnly}
        id={id}
        type="number"
      />
    </div>
  );

  function handleChange(range: Partial<Range>) {
    onChange({ ...value, ...range });
  }
}

function getNumber(value: number) {
  return Number.isNaN(value) ? 0 : value;
}

function RangeCheckbox({
  value,
  onChange,
}: {
  value: Range | number | undefined;
  onChange: (value: Range | number | undefined) => void;
}) {
  const isValueRange = isRange(value);
  return (
    <Checkbox
      label="range"
      checked={isValueRange}
      onChange={() => {
        if (!isValueRange) {
          onChange({ start: value || 0, end: value || 0 });
        } else {
          onChange(value.start);
        }
      }}
    />
  );
}
