import { useField } from 'formik';

import {
  Gpu,
  GpusList,
} from '@/react/portainer/environments/wizard/EnvironmentsCreationView/shared/Hardware/GpusList';

import { FormSection } from '@@/form-components/FormSection';

export function Hardware() {
  const [field, , helpers] = useField('gpus');

  function onChange(value: Gpu[]) {
    helpers.setValue(value);
  }

  return (
    <FormSection title="Hardware acceleration">
      <GpusList value={field.value} onChange={onChange} />
    </FormSection>
  );
}
