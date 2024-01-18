import { Box, Boxes } from 'lucide-react';

import { BoxSelector, BoxSelectorOption } from '@@/BoxSelector';
import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';

import { AppDataAccessPolicy } from '../types';

interface Props {
  isEdit: boolean;
  persistedFoldersUseExistingVolumes: boolean;
  value: AppDataAccessPolicy;
  onChange(value: AppDataAccessPolicy): void;
}

export function DataAccessPolicyFormSection({
  isEdit,
  persistedFoldersUseExistingVolumes,
  value,
  onChange,
}: Props) {
  const options = getOptions(value, isEdit, persistedFoldersUseExistingVolumes);

  return (
    <FormSection title="Data access policy" titleSize="sm">
      <TextTip color="blue">
        Specify how the data will be used across instances.
      </TextTip>
      <BoxSelector
        slim
        options={options}
        value={value}
        onChange={onChange}
        radioName="data_access_policy"
      />
    </FormSection>
  );
}

function getOptions(
  value: AppDataAccessPolicy,
  isEdit: boolean,
  persistedFoldersUseExistingVolumes: boolean
): ReadonlyArray<BoxSelectorOption<AppDataAccessPolicy>> {
  return [
    {
      value: 'Isolated',
      id: 'data_access_isolated',
      icon: Boxes,
      iconType: 'badge',
      label: 'Isolated',
      description:
        'Application will be deployed as a StatefulSet with each instantiating their own data',
      tooltip: () =>
        isEdit || persistedFoldersUseExistingVolumes
          ? 'Changing the data access policy is not allowed'
          : '',
      disabled: () =>
        (isEdit && value !== 'Isolated') || persistedFoldersUseExistingVolumes,
    },
    {
      value: 'Shared',
      id: 'data_access_shared',
      icon: Box,
      iconType: 'badge',
      label: 'Shared',
      description:
        'Application will be deployed as a Deployment with a shared storage access',
      tooltip: () => {
        if (persistedFoldersUseExistingVolumes) {
          return 'Changing the data access policy is not allowed';
        }
        return '';
      },
      disabled: () => isEdit && value !== 'Shared',
    },
  ] as const;
}
