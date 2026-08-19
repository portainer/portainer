import { Plus } from 'lucide-react';
import { useState } from 'react';

import { isLimitedToBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { Select, Input } from '@@/form-components/Input';
import { Widget, WidgetBody } from '@@/Widget';
import { Button } from '@@/buttons';
import { FormError } from '@@/form-components/FormError';
import { useInputList } from '@@/form-components/InputList/useInputList';
import { InputListActionButtons } from '@@/form-components/InputList/ActionButtons';

import { DnEntry, validateDnEntryValue } from './ldap-dn-utils';

const typeOptions = [
  { label: 'OU Name', value: 'ou' },
  { label: 'Folder Name', value: 'cn' },
] as const;

export function DnEntriesField({
  value,
  onChange,
  label = 'DN entries',
  limitedFeatureId,
}: {
  value: DnEntry[];
  onChange: (entries: DnEntry[]) => void;
  label?: string;
  limitedFeatureId?: FeatureId;
}) {
  const isLimited = isLimitedToBE(limitedFeatureId);

  const {
    handleMoveUp,
    handleMoveDown,
    handleRemoveItem,
    handleAdd,
    handleChangeItem,
  } = useInputList({
    value,
    onChange,
    itemBuilder: () => ({ type: 'ou' as const, value: '' }),
    movable: true,
  });

  return (
    <>
      <div>
        <label className="control-label text-left">{label}</label>
        <Button
          onClick={handleAdd}
          size="xsmall"
          color="light"
          icon={Plus}
          className="ml-2 !border-0"
          data-cy="ldap-dn-builder-add-button"
          disabled={isLimited}
        >
          add another entry
        </Button>
      </div>
      {value.length > 0 && (
        <Widget className="mt-1">
          <WidgetBody>
            <div className="flex flex-col gap-y-5">
              {value.map((entry, index) => (
                <div key={index} className="flex">
                  <DnEntryItem
                    item={entry}
                    onChange={(newEntry) => handleChangeItem(index, newEntry)}
                    disabled={isLimited}
                    readOnly={isLimited}
                  />
                  <InputListActionButtons
                    index={index}
                    count={value.length}
                    movable
                    onMoveUp={() => handleMoveUp(index)}
                    onMoveDown={() => handleMoveDown(index)}
                    onDelete={() => handleRemoveItem(index, entry)}
                    data-cy="ldap-dn-builder"
                    disabled={isLimited}
                  />
                </div>
              ))}
            </div>
          </WidgetBody>
        </Widget>
      )}
    </>
  );
}

interface DnEntryItemProps {
  item: DnEntry;
  onChange: (value: DnEntry) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

function DnEntryItem({ item, onChange, disabled, readOnly }: DnEntryItemProps) {
  // Keep the raw text the user typed locally so an invalid value (e.g. one
  // containing a comma) stays visible alongside the warning instead of being
  // dropped by the DN parse/build round-trip. Only valid values propagate up.
  const [value, setValue] = useState(item.value);

  // Re-sync when the entry value changes externally (e.g. reorder, suffix
  // change) using React's adjust-state-during-render pattern.
  const [lastItemValue, setLastItemValue] = useState(item.value);
  if (item.value !== lastItemValue) {
    setLastItemValue(item.value);
    setValue(item.value);
  }

  const error = validateDnEntryValue(value);

  function handleValueChange(newValue: string) {
    setValue(newValue);
    if (!validateDnEntryValue(newValue)) {
      onChange({ ...item, value: newValue });
    }
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex w-full gap-2">
        <div className="w-1/3">
          <Select
            options={typeOptions}
            value={item.type}
            onChange={(e) =>
              onChange({ ...item, type: e.target.value as 'ou' | 'cn' })
            }
            disabled={disabled}
            data-cy="ldap-dn-builder-select"
          />
        </div>
        <div className="w-5/12">
          <Input
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            disabled={disabled}
            readOnly={readOnly}
            data-cy="ldap-dn-builder-input"
          />
        </div>
      </div>
      {error && <FormError>{error}</FormError>}
    </div>
  );
}
