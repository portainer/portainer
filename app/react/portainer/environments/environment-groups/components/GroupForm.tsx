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
import {
  EnvironmentId,
  EnvironmentGroupId,
} from '@/react/portainer/environments/types';
import { useIsPureAdmin } from '@/react/hooks/useUser';
import { useCanExit } from '@/react/hooks/useCanExit';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { TextTip } from '@@/Tip/TextTip';
import { TagSelector } from '@@/TagSelector';
import { confirmGenericDiscard } from '@@/modals/confirm';
import { Button, LoadingButton } from '@@/buttons';
import { StickyFooter } from '@@/StickyFooter/StickyFooter';

import {
  UNASSIGNED_GROUP_ID,
  UNASSIGNED_GROUP_NAME,
} from '../utils/getPlatformLabel';

import { FormModeEnvironmentsSelector } from './AssociatedEnvironmentsSelector/FormModeEnvironmentsSelector';

export interface GroupFormValues {
  name: string;
  description: string;
  tagIds: Array<TagId>;
  /** Used in create mode only — undefined in edit mode */
  associatedEnvironments?: Array<EnvironmentId>;
}

interface Props {
  initialValues: GroupFormValues;
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
        submitLabel={submitLabel}
        submitLoadingLabel={submitLoadingLabel}
        groupId={groupId}
      />
    </Formik>
  );
}

interface InnerFormProps {
  submitLabel: string;
  submitLoadingLabel: string;
  groupId?: EnvironmentGroupId;
}

function InnerForm({
  submitLabel,
  submitLoadingLabel,
  groupId,
}: InnerFormProps) {
  const isPureAdmin = useIsPureAdmin();
  const {
    values,
    errors,
    handleChange,
    setFieldValue,
    isValid,
    dirty,
    isSubmitting,
  } = useFormikContext<GroupFormValues>();
  const isCreateMode = !groupId;
  const isUnassignedGroup = groupId === UNASSIGNED_GROUP_ID;

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
          readOnly={isUnassignedGroup}
        />
        {isUnassignedGroup && (
          <UnassignedGroupNameTip
            name={values.name}
            onReset={() => setFieldValue('name', UNASSIGNED_GROUP_NAME)}
          />
        )}
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

      {isCreateMode && (
        // Same UI as edit mode, but updates form values instead of the API
        <FormModeEnvironmentsSelector
          selectedIds={values.associatedEnvironments ?? []}
          onChange={(ids) => setFieldValue('associatedEnvironments', ids)}
        />
      )}

      <StickyFooter className="justify-end gap-4">
        <LoadingButton
          size="medium"
          loadingText={submitLoadingLabel}
          isLoading={isSubmitting}
          disabled={!isValid || isSubmitting || !dirty}
          data-cy="group-submit-button"
        >
          {submitLabel}
        </LoadingButton>
      </StickyFooter>
    </Form>
  );
}

function UnassignedGroupNameTip({
  name,
  onReset,
}: {
  name: string;
  onReset: () => void;
}) {
  const isRenamed = name !== UNASSIGNED_GROUP_NAME;

  return (
    <TextTip color="blue" className="mt-2">
      The default group can&apos;t be renamed.
      {isRenamed && ' Reset its name to save changes.'}
      {isRenamed && (
        <Button
          color="link"
          className="!ml-1 !p-0"
          onClick={onReset}
          data-cy="group-name-reset-button"
        >
          Reset name to &quot;{UNASSIGNED_GROUP_NAME}&quot;
        </Button>
      )}
    </TextTip>
  );
}
