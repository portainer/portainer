import { useState } from 'react';

import { DeployType } from '@/react/nomad/jobs/JobsView/JobsDatatable/types';

import { OnSubmit } from '@@/modals';
import { Dialog } from '@@/modals/Dialog';
import { buildCancelButton, buildConfirmButton } from '@@/modals/utils';

export function DeployTypePrompt({
  onSubmit,
}: {
  onSubmit: OnSubmit<DeployType>;
}) {
  const [deployType, setDeployType] = useState<DeployType>(DeployType.FDO);
  return (
    <Dialog
      title="How would you like to add an Edge Device?"
      message={
        <>
          <RadioInput
            name="deployType"
            value={DeployType.FDO}
            label="Provision bare-metal using Intel FDO"
            groupValue={deployType}
            onChange={setDeployType}
          />

          <RadioInput
            name="deployType"
            value={DeployType.MANUAL}
            onChange={setDeployType}
            groupValue={deployType}
            label="Deploy agent manually"
          />
        </>
      }
      buttons={[buildCancelButton(), buildConfirmButton()]}
      onSubmit={(confirm) => onSubmit(confirm ? deployType : undefined)}
    />
  );
}

function RadioInput<T extends number | string>({
  value,
  onChange,
  label,
  groupValue,
  name,
}: {
  value: T;
  onChange: (value: T) => void;
  label: string;
  groupValue: T;
  name: string;
}) {
  return (
    <label className="flex items-center gap-2">
      <input
        className="!m-0"
        type="radio"
        name={name}
        value={value}
        checked={groupValue === value}
        onChange={() => onChange(value)}
      />
      {label}
    </label>
  );
}
