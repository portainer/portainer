import { Form, Formik, useFormikContext } from 'formik';
import { useRouter } from '@uirouter/react';
import { useTranslation } from 'react-i18next';

import { EdgeGroupsSelector } from '@/react/edge/edge-stacks/components/EdgeGroupsSelector';
import { AssociatedEdgeEnvironmentsSelector } from '@/react/edge/components/AssociatedEdgeEnvironmentsSelector';
import { notifySuccess } from '@/portainer/services/notifications';

import { FormActions } from '@@/form-components/FormActions';
import { FormSection } from '@@/form-components/FormSection';
import { BoxSelector } from '@@/BoxSelector';
import { editor, upload } from '@@/BoxSelector/common-options/build-methods';
import { WebEditorForm } from '@@/WebEditorForm';
import { FileUploadForm } from '@@/form-components/FileUpload';

import { NameField } from '../components/EdgeJobForm/NameField';
import { JobConfigurationFieldset } from '../components/EdgeJobForm/JobConfigurationFieldset';
import {
  BasePayload,
  CreateEdgeJobPayload,
  useCreateEdgeJobMutation,
} from '../queries/useCreateEdgeJobMutation/useCreateEdgeJobMutation';
import {
  toRecurringRequest,
  toRecurringViewModel,
} from '../components/EdgeJobForm/parseRecurringValues';

import { FormValues } from './types';
import { useValidation } from './useValidation';

export function CreateEdgeJobForm() {
  const { t } = useTranslation();
  const mutation = useCreateEdgeJobMutation();
  const validation = useValidation();
  const router = useRouter();

  return (
    <Formik<FormValues>
      validationSchema={validation}
      validateOnMount
      initialValues={{
        name: '',
        method: 'editor',
        edgeGroupIds: [],
        environmentIds: [],
        file: undefined,
        fileContent: '',
        ...toRecurringViewModel(),
      }}
      onSubmit={(values) => {
        mutation.mutate(getPayload(values.method, values), {
          onSuccess: () => {
            notifySuccess(t('common.success'), t('edge.jobs.create.success'));
            router.stateService.go('^');
          },
        });
      }}
    >
      <InnerForm isLoading={mutation.isLoading} />
    </Formik>
  );
}

const buildMethods = [editor, upload];

function InnerForm({ isLoading }: { isLoading: boolean }) {
  const { t } = useTranslation();
  const { values, setFieldValue, isValid, errors } =
    useFormikContext<FormValues>();

  return (
    <Form className="form-horizontal">
      <NameField errors={errors.name} />

      <JobConfigurationFieldset />

      <FormSection title={t('edge.jobs.create.job_content')}>
        <BoxSelector
          value={values.method}
          options={buildMethods}
          onChange={(value) => setFieldValue('method', value)}
          radioName="build-method"
        />
      </FormSection>

      {values.method === 'editor' && (
        <WebEditorForm
          data-cy="edge-job-editor"
          id="edge-job-editor"
          onChange={(value) => setFieldValue('fileContent', value)}
          value={values.fileContent}
          textTip={t('edge.jobs.create.editor_tip')}
          type="shell"
          error={errors.fileContent}
        />
      )}

      {values.method === 'upload' && (
        <FileUploadForm
          data-cy="edge-job-upload"
          description={t('edge.jobs.create.upload_description')}
          onChange={(value) => setFieldValue('file', value)}
          value={values.file}
          required
        />
      )}

      <EdgeGroupsSelector
        onChange={(value) => setFieldValue('edgeGroupIds', value)}
        value={values.edgeGroupIds}
        error={errors.edgeGroupIds}
      />

      <FormSection title={t('edge.jobs.create.target_environments')}>
        <AssociatedEdgeEnvironmentsSelector
          onChange={(value) => setFieldValue('environmentIds', value)}
          value={values.environmentIds}
        />
      </FormSection>

      <FormActions
        submitLabel={t('edge.jobs.create.submit_label')}
        isLoading={isLoading}
        isValid={isValid}
        data-cy="edgeJobCreate-addJobButton"
        loadingText={t('edge.jobs.create.loading_text')}
        errors={errors}
      />
    </Form>
  );
}

function getPayload(
  method: 'upload' | 'editor',
  values: FormValues
): CreateEdgeJobPayload {
  switch (method) {
    case 'upload':
      if (!values.file) {
        throw new Error('File is required');
      }

      return {
        method: 'file',
        payload: {
          ...getBasePayload(values),
          file: values.file,
        },
      };
    case 'editor':
      return {
        method: 'string',
        payload: {
          ...getBasePayload(values),
          fileContent: values.fileContent,
        },
      };

    default:
      throw new Error(`Unknown method: ${method}`);
  }

  function getBasePayload(values: FormValues): BasePayload {
    return {
      name: values.name,
      edgeGroups: values.edgeGroupIds,
      endpoints: values.environmentIds,
      ...toRecurringRequest(values),
    };
  }
}
