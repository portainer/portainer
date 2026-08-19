import { debounce } from 'lodash';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

import { Input } from '../Input';

const SHORT_HEX_RE = /^#[0-9a-fA-F]{3}$/;
const FULL_HEX_RE = /^#[0-9a-fA-F]{6}$/;

export interface Props {
  value: string;
  onChange: (color: string) => void;
  'data-cy': string;
  id?: string;
  pickerId?: string;
}

export function ColorPicker({
  value,
  onChange,
  id = 'colorPickerTextInput',
  pickerId = 'colorPickerSwatch',
  'data-cy': dataCy = 'color-picker-input',
}: Props) {
  const [localHex, setLocalHex] = useState(value);

  // Tracks the last value emitted by this component so the sync effect below
  // doesn't reset localHex when the parent echoes our own change back.
  const lastEmitted = useRef(value);

  // Debounce only the swatch - useDebounce can't be used here because the text
  // input shows a different value (#abc) than what's emitted (#aabbcc).
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const debouncedOnChange = useRef(
    debounce((hex: string) => onChangeRef.current(hex), 80)
  ).current;

  useEffect(() => {
    if (value !== lastEmitted.current) {
      setLocalHex(value);
      lastEmitted.current = value;
    }
  }, [value]);

  const swatchColor = getSwatchColor(localHex, value);

  return (
    <div className="flex items-center gap-2">
      <label
        aria-label="Choose color"
        htmlFor={pickerId}
        className="form-control relative !mb-0 h-[34px] w-[34px] shrink-0 cursor-pointer overflow-hidden rounded"
        style={{ backgroundColor: swatchColor }}
      >
        <input
          type="color"
          id={pickerId}
          value={swatchColor}
          onChange={handleColorChange}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Choose highlight color"
        />
      </label>
      <Input
        id={id}
        value={localHex}
        onChange={handleTextChange}
        onBlur={handleBlur}
        className="w-28 uppercase"
        maxLength={7}
        placeholder="e.g. #ffbbbb"
        spellCheck={false}
        data-cy={dataCy}
      />
    </div>
  );

  function handleColorChange(e: ChangeEvent<HTMLInputElement>) {
    const hex = e.target.value;
    setLocalHex(hex);
    lastEmitted.current = hex;
    debouncedOnChange(hex);
  }

  function handleTextChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const normalized = raw.startsWith('#') ? raw : `#${raw}`;
    setLocalHex(normalized);
    if (isValidHex(normalized)) {
      const expanded = expandHex(normalized);
      lastEmitted.current = expanded;
      onChange(expanded);
    }
  }

  function handleBlur() {
    if (!isValidHex(localHex)) {
      setLocalHex(value);
    }
  }
}

function isValidHex(hex: string): boolean {
  return SHORT_HEX_RE.test(hex) || FULL_HEX_RE.test(hex);
}

/** Expands a 3-digit shorthand (#rgb → #rrggbb). Full hex passes through unchanged. */
function expandHex(hex: string): string {
  if (SHORT_HEX_RE.test(hex)) {
    const [, r, g, b] = hex;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return hex;
}

function getSwatchColor(localHex: string, committedValue: string): string {
  if (isValidHex(localHex)) {
    return expandHex(localHex);
  }
  if (isValidHex(committedValue)) {
    return expandHex(committedValue);
  }
  return '#ffffff';
}
