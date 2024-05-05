import { useFormikContext } from 'formik';

import { FormSection } from '@@/form-components/FormSection';
import { BoxSelector } from '@@/BoxSelector';

import { cronMethodOptions } from '../../CreateView/cron-method-options';

import { FormValues } from './types';
import { AdvancedCronFieldset } from './AdvancedCronFieldset';
import { BasicCronFieldset } from './BasicCronFieldset';

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
