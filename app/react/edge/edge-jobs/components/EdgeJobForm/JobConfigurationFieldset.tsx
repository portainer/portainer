import { useFormikContext } from 'formik';
import { Calendar, Edit } from 'lucide-react';

import { FormSection } from '@@/form-components/FormSection';
import { BoxSelector, BoxSelectorOption } from '@@/BoxSelector';

import { FormValues } from '../../CreateView/types';

import { AdvancedCronFieldset } from './AdvancedCronFieldset';
import { BasicCronFieldset } from './BasicCronFieldset';

export const cronMethodOptions: ReadonlyArray<BoxSelectorOption<string>> = [
  {
    id: 'config_basic',
    value: 'basic',
    icon: Calendar,
    iconType: 'badge',
    label: 'Basic configuration',
    description: 'Select date from calendar',
  },
  {
    id: 'config_advanced',
    value: 'advanced',
    icon: Edit,
    iconType: 'badge',
    label: 'Advanced configuration',
    description: 'Write your own cron rule',
  },
] as const;

export function JobConfigurationFieldset() {
  const { values, setFieldValue } = useFormikContext<FormValues>();

  return (
    <>
      <FormSection title="Edge job configuration">
        <BoxSelector
          slim
          radioName="configuration"
          value={values.cronMethod}
          options={cronMethodOptions}
          onChange={(value) => {
            setFieldValue('cronMethod', value);
            setFieldValue('cronExpression', '');
          }}
        />
      </FormSection>

      {values.cronMethod === 'basic' ? (
        <BasicCronFieldset />
      ) : (
        <AdvancedCronFieldset />
      )}
    </>
  );
}
