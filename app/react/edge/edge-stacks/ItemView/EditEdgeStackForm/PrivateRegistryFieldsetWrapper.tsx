import _ from 'lodash';

import { notifyError } from '@/portainer/services/notifications';
import { PrivateRegistryFieldset } from '@/react/edge/edge-stacks/components/PrivateRegistryFieldset';
import { useRegistries } from '@/react/portainer/registries/queries/useRegistries';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { useParseRegistries } from '../../queries/useParseRegistries';

import { FormValues } from './types';

export function PrivateRegistryFieldsetWrapper({
  value,
  error,
  onChange,
  onFieldError,
  values,
  isGit,
}: {
  value: FormValues['privateRegistryId'];
  error?: string;
  onChange: (value?: number) => void;
  values: {
    fileContent?: string;
    file?: File;
  };
  onFieldError: (message: string) => void;
  isGit?: boolean;
}) {
  const dryRunMutation = useParseRegistries();

  const registriesQuery = useRegistries({ hideDefault: true });

  if (!registriesQuery.data) {
    return null;
  }

  return (
    <PrivateRegistryFieldset
      value={value}
      formInvalid={!values.file && !values.fileContent && !isGit}
      errorMessage={error}
      registries={registriesQuery.data}
      onChange={() => matchRegistry(values)}
      onSelect={(value) => onChange(value)}
      isActive={!!value}
      clearRegistries={() => onChange(undefined)}
      method={isGit ? 'repository' : 'file'}
    />
  );

  async function matchRegistry(values: { fileContent?: string; file?: File }) {
    if (isGit) {
      return;
    }

    try {
      if (!isBE) {
        return;
      }

      const registries = await dryRunMutation.mutateAsync(values);

      if (registries.length === 0) {
        return;
      }

      const validRegistry = onlyOne(registries);
      if (validRegistry) {
        onChange(registries[0]);
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
