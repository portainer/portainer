import { useFormikContext } from 'formik';

import { Widget } from '@@/Widget';
import { BoxSelector } from '@@/BoxSelector';

import { FormValues } from '../type';
import { validationSchema } from '../validation';

import { sourceTypeOptions } from './typeSelectOptions';

export function TypeSelectStep() {
  const { values, setFieldValue } = useFormikContext<FormValues>();

  return (
    <>
      <Widget.Title
        title="Select Source type"
        subtitle="Choose the type of external source you want to connect to Portainer. Currently only Git repositories can be connected. Support for Helm repositories, OCI registries, and S3 buckets is coming in a future release."
      />
      <Widget.Body>
        <BoxSelector
          value={values.type}
          onChange={(type) => setFieldValue('type', type)}
          radioName="source-type-selector"
          options={sourceTypeOptions}
        />
      </Widget.Body>
    </>
  );
}

export function validateTypeSelectStep() {
  return validationSchema().pick(['type']);
}
