import { Field, Form, Formik, useFormikContext } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { FormSection } from '@@/form-components/FormSection';
import { BoxSelector } from '@@/BoxSelector';
import { FormActions } from '@@/form-components/FormActions';

import { groupTypeOptions } from './group-type-options';
import { FormValues } from './types';
import { useValidation } from './useValidation';
import { DynamicGroupFieldset } from './DynamicGroupFieldset';
import { StaticGroupFieldset } from './StaticGroupFieldset';

export function EdgeGroupForm({
  onSubmit,
  isLoading,
  initialValues,
}: {
  onSubmit: (values: FormValues) => void;
  isLoading: boolean;
  initialValues?: FormValues;
}) {
  const validation = useValidation();
  return (
    <Formik
      validationSchema={validation}
      validateOnMount
      initialValues={
        initialValues || {
          name: '',
          dynamic: false,
          environmentIds: [],
          partialMatch: false,
          tagIds: [],
        }
      }
      onSubmit={onSubmit}
    >
      <InnerForm isLoading={isLoading} isCreate={!initialValues} />
    </Formik>
  );
}

function InnerForm({
  isLoading,
  isCreate,
}: {
  isLoading: boolean;
  isCreate: boolean;
}) {
  const { values, errors, setFieldValue, isValid } =
    useFormikContext<FormValues>();

  return (
    <Form className="form-horizontal">
      <FormControl
        label="Name"
        required
        errors={errors.name}
        inputId="group_name"
      >
        <Field
          as={Input}
          name="name"
          placeholder="e.g. mygroup"
          data-cy="edgeGroupCreate-groupNameInput"
          id="group_name"
        />
      </FormControl>

      <FormSection title="Group type">
        <BoxSelector
          slim
          value={values.dynamic}
          onChange={(dynamic) => setFieldValue('dynamic', dynamic)}
          options={groupTypeOptions}
          radioName="groupTypeDynamic"
        />
      </FormSection>

      {values.dynamic ? <DynamicGroupFieldset /> : <StaticGroupFieldset />}

      <FormActions
        submitLabel={isCreate ? 'Add edge group' : 'Save edge group'}
        isLoading={isLoading}
        isValid={isValid}
        data-cy="edgeGroupCreate-addGroupButton"
        loadingText="In progress..."
      />
    </Form>
  );
}
