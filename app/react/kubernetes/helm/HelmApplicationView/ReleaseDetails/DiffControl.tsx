import { ChangeEvent } from 'react';

import { useDebounce } from '@/react/hooks/useDebounce';

import { RadioGroup, RadioGroupOption } from '@@/RadioGroup/RadioGroup';
import { Input } from '@@/form-components/Input';
import { Checkbox } from '@@/form-components/Checkbox';

import {
  LatestRevisionNumber,
  EarliestRevisionNumber,
  CompareRevisionNumber,
  SelectedRevisionNumber,
} from './types';

export type DiffViewMode = 'view' | 'previous' | 'specific';

type Props = {
  selectedRevisionNumber: SelectedRevisionNumber;
  latestRevisionNumber: LatestRevisionNumber;
  compareRevisionNumber: CompareRevisionNumber;
  setCompareRevisionNumber: (
    compareRevisionNumber: CompareRevisionNumber
  ) => void;
  earliestRevisionNumber: EarliestRevisionNumber;
  diffViewMode: DiffViewMode;
  setDiffViewMode: (diffViewMode: DiffViewMode) => void;
  isUserSupplied?: boolean;
  setIsUserSupplied?: (isUserSupplied: boolean) => void;
  showUserSuppliedCheckbox?: boolean;
};

export function DiffControl({
  selectedRevisionNumber,
  latestRevisionNumber,
  compareRevisionNumber,
  setCompareRevisionNumber,
  earliestRevisionNumber,
  diffViewMode,
  setDiffViewMode,
  isUserSupplied,
  setIsUserSupplied,
  showUserSuppliedCheckbox,
}: Props) {
  // If there is a different version to compare, show view option radio group
  const showViewOptions = latestRevisionNumber > earliestRevisionNumber;

  // to show the previous option, the earliest revision number available must be less than the selected revision number. (compare is still allowed, because we can still compare with a later revision)
  const disabledPreviousOption =
    earliestRevisionNumber >= selectedRevisionNumber;

  const options: Array<RadioGroupOption<DiffViewMode>> = [
    { label: 'View', value: 'view' },
    {
      label: 'Diff with previous',
      value: 'previous',
      disabled: disabledPreviousOption,
    },
    {
      label: (
        <DiffWithSpecificRevision
          latestRevisionNumber={latestRevisionNumber}
          earliestRevisionNumber={earliestRevisionNumber}
          compareRevisionNumber={compareRevisionNumber}
          setCompareRevisionNumber={setCompareRevisionNumber}
        />
      ),
      value: 'specific',
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-16 gap-y-1">
      {showViewOptions && (
        <RadioGroup
          options={options}
          selectedOption={diffViewMode}
          name="diffControl"
          onOptionChange={setDiffViewMode}
          groupClassName="inline-flex flex-wrap gap-x-16 gap-y-1"
          itemClassName="control-label !p-0 text-left font-normal"
        />
      )}
      {!!showUserSuppliedCheckbox && !!setIsUserSupplied && (
        <Checkbox
          label="User defined only"
          id="values-details-user-supplied"
          checked={isUserSupplied}
          onChange={() => setIsUserSupplied(!isUserSupplied)}
          data-cy="values-details-user-supplied"
          className="control-label font-normal"
          bold={false}
        />
      )}
    </div>
  );
}

function DiffWithSpecificRevision({
  latestRevisionNumber,
  earliestRevisionNumber,
  compareRevisionNumber,
  setCompareRevisionNumber,
}: {
  latestRevisionNumber: LatestRevisionNumber;
  earliestRevisionNumber: EarliestRevisionNumber;
  compareRevisionNumber: CompareRevisionNumber;
  setCompareRevisionNumber: (
    compareRevisionNumber: CompareRevisionNumber
  ) => void;
}) {
  // the revision number is debounced to avoid too many requests to the backend
  const [
    debouncedSetCompareRevisionNumber,
    setDebouncedSetCompareRevisionNumber,
  ] = useDebounce(compareRevisionNumber, setCompareRevisionNumber, 500);

  return (
    <>
      <span>Diff with specific revision:</span>
      <Input
        type="number"
        min={earliestRevisionNumber}
        max={latestRevisionNumber}
        value={debouncedSetCompareRevisionNumber}
        onChange={handleSpecificRevisionChange}
        className="ml-2 w-20"
        data-cy="revision-specific-input"
      />
    </>
  );

  function handleSpecificRevisionChange(e: ChangeEvent<HTMLInputElement>) {
    const inputNumber = e.target.valueAsNumber;
    // handle out of range values
    if (inputNumber > latestRevisionNumber) {
      setCompareRevisionNumber(latestRevisionNumber);
      return;
    }
    if (inputNumber < earliestRevisionNumber) {
      setCompareRevisionNumber(earliestRevisionNumber);
      return;
    }
    setDebouncedSetCompareRevisionNumber(inputNumber);
  }
}
