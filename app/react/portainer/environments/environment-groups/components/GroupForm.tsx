import {
  Form,
  Formik,
  FormikHelpers,
  FormikProps,
  useFormikContext,
} from 'formik';
import { object, string, array, number } from 'yup';
import { useRef } from 'react';

import { TagId } from '@/portainer/tags/types';
import { useIsPureAdmin } from '@/react/hooks/useUser';
import { useCanExit } from '@/react/hooks/useCanExit';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { FormSection } from '@@/form-components/FormSection';
import { TagSelector } from '@@/TagSelector';
import { confirmGenericDiscard } from '@@/modals/confirm';
import { FormActions } from '@@/form-components/FormActions';

import { EnvironmentGroupId, EnvironmentId } from '../../types';

import { AssociatedEnvironmentsSelector } from './AssociatedEnvironmentsSelector/AssociatedEnvironmentsSelector';
import { AvailableEnvironmentsTable } from './AssociatedEnvironmentsSelector/AvailableEnvironmentsTable';

export interface GroupFormValues {
  name: string;
  description: string;
  tagIds: Array<TagId>;
  associatedEnvironments: Array<EnvironmentId>;
}

interface Props {
  initialValues: GroupFormValues;
  /** Should return a Promise that resolves when navigation happens (to keep isSubmitting true) */
  onSubmit: (
    values: GroupFormValues,
    helpers: FormikHelpers<GroupFormValues>
  ) => Promise<void>;
  submitLabel: string;
  submitLoadingLabel: string;
  /** Group ID - if provided, shows environment selector (not for unassigned group) */
  groupId?: EnvironmentGroupId;
}

const validationSchema = object({
  name: string().required('Name is required'),
  description: string(),
  tagIds: array(number()),
  associatedEnvironments: array(),
});

export function GroupForm({
  initialValues,
  onSubmit,
  submitLabel,
  submitLoadingLabel,
  groupId,
}: Props) {
  const formikRef = useRef<FormikProps<GroupFormValues>>(null);
  useCanExit(() => !formikRef.current?.dirty || confirmGenericDiscard());

  return (
    <Formik
      innerRef={formikRef}
      initialValues={initialValues}
      onSubmit={onSubmit}
      validationSchema={validationSchema}
      validateOnMount
      enableReinitialize
    >
      <InnerForm
        initialValues={initialValues}
        submitLabel={submitLabel}
        submitLoadingLabel={submitLoadingLabel}
        groupId={groupId}
      />
    </Formik>
  );
}

interface InnerFormProps {
  initialValues: GroupFormValues;
  submitLabel: string;
  submitLoadingLabel: string;
  groupId?: EnvironmentGroupId;
}

function InnerForm({
  initialValues,
  submitLabel,
  submitLoadingLabel,
  groupId,
}: InnerFormProps) {
  const isPureAdmin = useIsPureAdmin();
  const isUnassignedGroup = groupId === 1;
  const {
    values,
    errors,
    handleChange,
    setFieldValue,
    isValid,
    dirty,
    isSubmitting,
  } = useFormikContext<GroupFormValues>();

  return (
    <Form className="form-horizontal">
      <FormControl
        label="Name"
        required
        errors={errors.name}
        inputId="group-name"
      >
        <Input
          id="group-name"
          name="name"
          value={values.name}
          onChange={handleChange}
          placeholder="e.g. my-group"
          data-cy="group-name-input"
        />
      </FormControl>

      <FormControl label="Description" inputId="group-description">
        <Input
          id="group-description"
          name="description"
          value={values.description}
          onChange={handleChange}
          placeholder="e.g. production environments..."
          data-cy="group-description-input"
        />
      </FormControl>

      <TagSelector
        value={values.tagIds}
        onChange={(tagIds) => setFieldValue('tagIds', tagIds)}
        allowCreate={isPureAdmin}
      />

      {isUnassignedGroup ? (
        <FormSection title="Unassociated environments">
          <AvailableEnvironmentsTable
            title="Unassociated environments"
            excludeIds={[]}
            data-cy="group-unassociatedEndpoints"
          />
        </FormSection>
      ) : (
        <AssociatedEnvironmentsSelector
          associatedEnvironmentIds={values.associatedEnvironments}
          initialAssociatedEnvironmentIds={initialValues.associatedEnvironments}
          onChange={(ids) => setFieldValue('associatedEnvironments', ids)}
        />
      )}

      <FormActions
        submitLabel={submitLabel}
        loadingText={submitLoadingLabel}
        isLoading={isSubmitting}
        isValid={isValid && !isSubmitting && dirty}
        errors={errors}
        data-cy="group-submit-button"
      />
    </Form>
  );
}
