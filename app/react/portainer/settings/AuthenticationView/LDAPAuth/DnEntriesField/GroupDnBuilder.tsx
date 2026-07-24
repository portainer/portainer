import { useEffect, useRef, useState } from 'react';

import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { isLimitedToBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { DnEntriesField } from './DnEntriesField';
import { GroupNameField } from './GroupNameField';
import { DnEntry, parseDN, buildDN } from './ldap-dn-utils';

interface Props {
  value: string;
  onChange: (index: number, dn: string) => void;
  suffix: string;
  index: number;
  onRemoveClick?: (index: number) => void;
  limitedFeatureId?: FeatureId;
}

export function GroupDnBuilder({
  value,
  onChange,
  suffix,
  index,
  onRemoveClick,
  limitedFeatureId,
}: Props) {
  const isLimited = isLimitedToBE(limitedFeatureId);
  const [groupName, setGroupName] = useState(() =>
    parseGroupName(value, suffix)
  );
  const [entries, setEntries] = useState<DnEntry[]>(() =>
    parseDN(parsePath(value, suffix), suffix)
  );

  // The DN string can't represent an empty (in-progress) group name or path
  // row, so re-parsing our own emitted value would drop it — making the field
  // vanish as you clear its text. Track what we emitted so we re-sync only when
  // `value` changes from an external source (initial load, reset).
  const emittedRef = useRef(buildGroupDN(groupName, entries, suffix));

  useEffect(() => {
    if (value !== emittedRef.current) {
      const parsedGroupName = parseGroupName(value, suffix);
      const parsedEntries = parseDN(parsePath(value, suffix), suffix);
      emittedRef.current = buildGroupDN(parsedGroupName, parsedEntries, suffix);
      setGroupName(parsedGroupName);
      setEntries(parsedEntries);
    }
  }, [value, suffix]);

  // Keep the emitted DN in sync with the group name, path entries and suffix.
  useEffect(() => {
    const dn = buildGroupDN(groupName, entries, suffix);
    if (dn !== emittedRef.current) {
      emittedRef.current = dn;
      onChange(index, dn);
    }
  }, [groupName, entries, suffix, index, onChange]);

  return (
    <>
      <GroupNameField
        id={`group-name-input-${index}`}
        value={groupName}
        onChange={setGroupName}
        disabled={isLimited}
        onRemoveClick={onRemoveClick ? () => onRemoveClick(index) : undefined}
      />
      <DnEntriesField
        value={entries}
        onChange={setEntries}
        label="Path to group"
        limitedFeatureId={limitedFeatureId}
      />
    </>
  );
}

export function parseGroupName(value: string, suffix: string): string {
  if (!value || value === suffix) return '';
  const [groupNamePart] = value.split(/,(.+)/);
  return groupNamePart.replace(/^cn=/i, '');
}

function parsePath(value: string, suffix: string): string {
  if (!value || value === suffix) return suffix;
  const [, rest] = value.split(/,(.+)/);
  return rest || suffix;
}

export function buildGroupDN(
  groupName: string,
  entries: DnEntry[],
  suffix: string
): string {
  if (!groupName) {
    return suffix;
  }

  const groupNameEntry = `cn=${groupName}`;
  const path = buildDN(entries, suffix);
  const pathPart = path && path !== suffix ? path : suffix;
  return pathPart ? `${groupNameEntry},${pathPart}` : groupNameEntry;
}
