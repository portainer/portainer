import { Form, Formik, useFormikContext } from 'formik';
import { useRouter } from '@uirouter/react';

import { EdgeGroupsSelector } from '@/react/edge/edge-stacks/components/EdgeGroupsSelector';
import { AssociatedEdgeEnvironmentsSelector } from '@/react/edge/components/AssociatedEdgeEnvironmentsSelector';
import { notifySuccess } from '@/portainer/services/notifications';

import { FormActions } from '@@/form-components/FormActions';
import { FormSection } from '@@/form-components/FormSection';
import { WebEditorForm } from '@@/WebEditorForm';

import { NameField } from '../../components/EdgeJobForm/NameField';
import { JobConfigurationFieldset } from '../../components/EdgeJobForm/JobConfigurationFieldset';
import {
  UpdatePayload,
  useUpdateEdgeJobMutation,
} from '../../queries/useUpdateEdgeJobMutation';
import {
  toRecurringRequest,
  toRecurringViewModel,
} from '../../components/EdgeJobForm/parseRecurringValues';
import { EdgeJobResponse } from '../../queries/useEdgeJob';
import { useEdgeJobFile } from '../../queries/useEdgeJobFile';
import { useValidation } from '../useValidation';

import { FormValues } from './types';

export function UpdateEdgeJobForm({ edgeJob }: { edgeJob: EdgeJobResponse }) {
  const fileQuery = useEdgeJobFile(edgeJob.Id);
  const mutation = useUpdateEdgeJobMutation();
  const validation = useValidation({ id: edgeJob.Id });
  const router = useRouter();

  if (!fileQuery.isSuccess) {
    return null;
  }

  return (
    <Formik<FormValues>
      validationSchema={validation}
      validateOnMount
      initialValues={{
        name: edgeJob.Name,

        edgeGroupIds: edgeJob.EdgeGroups || [],
        environmentIds: edgeJob.Endpoints || [],
        fileContent: fileQuery.data,
        ...toRecurringViewModel({
          cronExpression: edgeJob.CronExpression,
          recurring: edgeJob.Recurring,
        }),
      }}
      onSubmit={(values) => {
        mutation.mutate(
          { id: edgeJob.Id, payload: getPayload(values) },
          {
            onSuccess: () => {
              notifySuccess('Success', 'Edge job successfully updated');
              router.stateService.go('^');
            },
          }
        );
      }}
    >
      <InnerForm isLoading={mutation.isLoading} />
    </Formik>
  );
}

function InnerForm({ isLoading }: { isLoading: boolean }) {
  const { values, setFieldValue, isValid, errors } =
    useFormikContext<FormValues>();

  return (
    <Form className="form-horizontal">
      <NameField errors={errors.name} />

      <JobConfigurationFieldset />

      <WebEditorForm
        data-cy="edge-job-editor"
        id="edge-job-editor"
        onChange={(value) => setFieldValue('fileContent', value)}
        value={values.fileContent}
        textTip="Define or paste the content of your script file here"
        type="shell"
        error={errors.fileContent}
      />

      <EdgeGroupsSelector
        onChange={(value) => setFieldValue('edgeGroupIds', value)}
        value={values.edgeGroupIds}
        error={errors.edgeGroupIds}
      />

      <FormSection title="Target environments">
        <AssociatedEdgeEnvironmentsSelector
          onChange={(value) => setFieldValue('environmentIds', value)}
          value={values.environmentIds}
        />
      </FormSection>

      <FormActions
        submitLabel="Update edge job"
        isLoading={isLoading}
        isValid={isValid}
        data-cy="updateJobButton"
        loadingText="In progress..."
        errors={errors}
      />
    </Form>
  );
}

function getPayload(values: FormValues): UpdatePayload {
  return {
    name: values.name,
    edgeGroups: values.edgeGroupIds,
    endpoints: values.environmentIds,
    fileContent: values.fileContent,
    ...toRecurringRequest(values),
  };
}
