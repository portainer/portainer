import _ from 'lodash';

import { notifyError } from '@/portainer/services/notifications';
import { PrivateRegistryFieldset } from '@/react/edge/edge-stacks/components/PrivateRegistryFieldset';
import { useCreateStackFromFileContent } from '@/react/edge/edge-stacks/queries/useCreateStackFromFileContent';
import { useRegistries } from '@/react/portainer/registries/queries/useRegistries';

import { FormValues } from './types';

export function PrivateRegistryFieldsetWrapper({
  value,
  isValid,
  error,
  onChange,
  values,
  stackName,
  onFieldError,
}: {
  value: FormValues['privateRegistryId'];
  isValid: boolean;
  error?: string;
  onChange: (value?: number) => void;
  values: FormValues;
  stackName: string;
  onFieldError: (message: string) => void;
}) {
  const dryRunMutation = useCreateStackFromFileContent();

  const registriesQuery = useRegistries();

  if (!registriesQuery.data) {
    return null;
  }

  return (
    <PrivateRegistryFieldset
      value={value}
      formInvalid={!isValid}
      errorMessage={error}
      registries={registriesQuery.data}
      onChange={() => matchRegistry()}
      onSelect={(value) => onChange(value)}
      isActive={!!value}
      clearRegistries={() => onChange(undefined)}
    />
  );

  async function matchRegistry() {
    try {
      const response = await dryRunMutation.mutateAsync({
        name: `${stackName}-dryrun`,
        stackFileContent: values.content,
        edgeGroups: values.edgeGroups,
        deploymentType: values.deploymentType,
        dryRun: true,
      });

      if (response.Registries.length === 0) {
        onChange(undefined);
        return;
      }

      const validRegistry = onlyOne(response.Registries);
      if (validRegistry) {
        onChange(response.Registries[0]);
      } else {
        onChange(undefined);
        onFieldError(
          'Images need to be from a single registry, please edit and reload'
        );
      }
    } catch (err) {
      notifyError('Failure', err as Error, 'Unable to retrieve registries');
    }
  }

  function onlyOne<T extends string | number>(arr: Array<T>) {
    return _.uniq(arr).length === 1;
  }
}
