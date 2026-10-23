import { useEffect, useRef, useState } from 'react';

import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { DnEntriesField } from './DnEntriesField';
import { parseDN, buildDN, DnEntry } from './ldap-dn-utils';

interface Props {
  value: string | undefined;
  suffix: string;
  onChange: (dn: string) => void;
  label?: string;
  limitedFeatureId?: FeatureId;
}

export function DnBuilder({
  value,
  suffix,
  onChange,
  label,
  limitedFeatureId,
}: Props) {
  const [entries, setEntries] = useState<DnEntry[]>(() =>
    parseDN(value, suffix)
  );

  // The DN string can't represent an empty (in-progress) row, so re-parsing our
  // own emitted value would drop such a row — making the box vanish the moment
  // you clear its text. Track what we emitted so we re-sync entries only when
  // `value` changes from an external source (initial load, reset).
  const emittedRef = useRef(buildDN(entries, suffix));

  useEffect(() => {
    if ((value || '') !== emittedRef.current) {
      const parsed = parseDN(value, suffix);
      emittedRef.current = buildDN(parsed, suffix);
      setEntries(parsed);
    }
  }, [value, suffix]);

  // Keep the emitted DN in sync with the entries and suffix.
  useEffect(() => {
    const dn = buildDN(entries, suffix);
    if (dn !== emittedRef.current) {
      emittedRef.current = dn;
      onChange(dn);
    }
  }, [entries, suffix, onChange]);

  return (
    <DnEntriesField
      value={entries}
      onChange={setEntries}
      label={label}
      limitedFeatureId={limitedFeatureId}
    />
  );
}
