import { FormikErrors } from 'formik';
import { MultiValue } from 'react-select';

import { Registry } from '@/react/portainer/registries/types';
import { useEnvironmentRegistries } from '@/react/portainer/environments/queries/useEnvironmentRegistries';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { InlineLoader } from '@@/InlineLoader';
import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';

import { RegistriesSelector } from './RegistriesSelector';

type Props = {
  values: MultiValue<Registry>;
  onChange: (value: MultiValue<Registry>) => void;
  errors?: string | string[] | FormikErrors<Registry>[];
};

export function RegistriesFormSection({ values, onChange, errors }: Props) {
  const environmentId = useEnvironmentId();
  const registriesQuery = useEnvironmentRegistries(environmentId, {
    hideDefault: true,
  });
  return (
    <FormSection title="Registries">
      <FormControl
        inputId="registries"
        label="Select registries"
        required
        errors={errors}
      >
        {registriesQuery.isLoading && (
          <InlineLoader>Loading registries...</InlineLoader>
        )}
        {registriesQuery.data && (
          <RegistriesSelector
            value={values}
            onChange={(registries) => onChange(registries)}
            options={registriesQuery.data}
            inputId="registries"
          />
        )}
      </FormControl>
    </FormSection>
  );
}
