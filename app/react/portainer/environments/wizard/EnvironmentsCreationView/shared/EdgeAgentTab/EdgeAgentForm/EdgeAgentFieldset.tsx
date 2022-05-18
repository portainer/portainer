import { useFormikContext } from 'formik';

import { EdgeCheckinIntervalField } from '@/edge/components/EdgeCheckInIntervalField';

import { NameField } from '../../NameField';

import { PortainerUrlField } from './PortainerUrlField';
import { FormValues } from './types';

interface EdgeAgentFormProps {
  readonly?: boolean;
}

export function EdgeAgentFieldset({ readonly }: EdgeAgentFormProps) {
  const { values, setFieldValue } = useFormikContext<FormValues>();

  return (
    <>
      <NameField readonly={readonly} />
      <PortainerUrlField fieldName="portainerUrl" readonly={readonly} />
      <EdgeCheckinIntervalField
        readonly={readonly}
        onChange={(value) => setFieldValue('pollFrequency', value)}
        value={values.pollFrequency}
      />
    </>
  );
}
