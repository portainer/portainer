import { useField } from 'formik';
import _ from 'lodash';
import { useState, ChangeEvent } from 'react';

import { EnvironmentId } from '@/react/portainer/environments/types';

import { Select } from '@@/form-components/Input';
import { Checkbox } from '@@/form-components/Checkbox';

import { FormValues } from './types';
import { compareVersion } from './utils';

interface Props {
  currentVersion: string;
  environmentIds: EnvironmentId[];
  versions: { label: string; value: string }[];
  disabled?: boolean;
}

export function EnvironmentSelectionItem({
  environmentIds,
  versions,
  currentVersion = 'unknown',
  disabled,
}: Props) {
  const [{ value }, , { setValue }] =
    useField<FormValues['environments']>('environments');
  const isChecked = environmentIds.every((envId) => !!value[envId]);
  const supportedVersions = versions.filter(
    ({ value }) => compareVersion(currentVersion, value) // versions that are bigger than the current version
  );

  const maxVersion = _.last(supportedVersions)?.value;

  const [selectedVersion, setSelectedVersion] = useState(
    value[environmentIds[0]] || maxVersion || ''
  );

  return (
    <div className="flex items-center">
      <Checkbox
        className="flex items-center"
        id={`version_checkbox_${currentVersion}`}
        checked={isChecked}
        onChange={() => handleChange(!isChecked)}
        disabled={disabled}
      />

      <span className="font-normal flex items-center whitespace-nowrap gap-1">
        {environmentIds.length} edge agents update from v{currentVersion} to
        <Select
          disabled={disabled}
          value={selectedVersion}
          options={supportedVersions}
          onChange={handleVersionChange}
        />
      </span>
    </div>
  );

  function handleVersionChange(e: ChangeEvent<HTMLSelectElement>) {
    const version = e.target.value;
    setSelectedVersion(version);
    if (isChecked) {
      handleChange(isChecked, version);
    }
  }

  function handleChange(isChecked: boolean, version: string = selectedVersion) {
    const newValue = !isChecked
      ? Object.fromEntries(
          Object.entries(value).filter(
            ([envId]) => !environmentIds.includes(parseInt(envId, 10))
          )
        )
      : {
          ...value,
          ...Object.fromEntries(
            environmentIds.map((envId) => [envId, version])
          ),
        };

    setValue(newValue);
  }
}
