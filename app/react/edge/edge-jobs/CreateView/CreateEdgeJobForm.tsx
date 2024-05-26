import { Form, Formik, useFormikContext } from 'formik';
import { useRouter } from '@uirouter/react';
import moment from 'moment';

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
import { FormValues } from '../components/EdgeJobForm/types';
import { useValidation } from '../components/EdgeJobForm/useValidation';
import { JobConfigurationFieldset } from '../components/EdgeJobForm/JobConfigurationFieldset';
import {
  BasePayload,
  CreateEdgeJobPayload,
  useCreateEdgeJobMutation,
} from '../queries/useCreateEdgeJobMutation/useCreateEdgeJobMutation';
import { defaultCronExpression } from '../components/EdgeJobForm/RecurringFieldset';

export function CreateEdgeJobForm() {
  const mutation = useCreateEdgeJobMutation();
  const validation = useValidation();
  const router = useRouter();

  return (
    <Formik<FormValues>
      validationSchema={validation}
      validateOnMount
      initialValues={{
        name: '',
        recurring: false,
        cronExpression: '',
        recurringOption: defaultCronExpression,
        method: 'editor',
        cronMethod: 'basic',
        dateTime: new Date(),
        edgeGroupIds: [],
        environmentIds: [],
        file: undefined,
        fileContent: '',
      }}
      onSubmit={(values) => {
        mutation.mutate(getPayload(values.method, values), {
          onSuccess: () => {
            notifySuccess('Success', 'Edge job successfully created');
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
  const { values, setFieldValue, isValid, errors } =
    useFormikContext<FormValues>();

  return (
    <Form className="form-horizontal">
      <NameField errors={errors.name} />

      <JobConfigurationFieldset />

      <FormSection title="Job content">
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
          placeholder="Define or paste the content of your script file here"
          shell
          error={errors.fileContent}
        />
      )}

      {values.method === 'upload' && (
        <FileUploadForm
          data-cy="edge-job-upload"
          description="You can upload a script file from your computer."
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

      <FormSection title="Target environments">
        <AssociatedEdgeEnvironmentsSelector
          onChange={(value) => setFieldValue('environmentIds', value)}
          value={values.environmentIds}
        />
      </FormSection>

      <FormActions
        submitLabel="Add edge job"
        isLoading={isLoading}
        isValid={isValid}
        data-cy="edgeJobCreate-addJobButton"
        loadingText="In progress..."
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
      ...getRecurringConfig(values),
    };
  }

  function getRecurringConfig(values: FormValues): {
    recurring: boolean;
    cronExpression: string;
  } {
    if (values.cronMethod !== 'basic') {
      return {
        recurring: true,
        cronExpression: values.cronExpression,
      };
    }

    if (values.recurring) {
      return {
        recurring: true,
        cronExpression: values.recurringOption,
      };
    }

    return {
      recurring: false,
      cronExpression: dateTimeToCron(values.dateTime),
    };

    function dateTimeToCron(datetime: Date) {
      const date = moment(datetime);
      return [
        date.minutes(),
        date.hours(),
        date.date(),
        date.month() + 1,
        '*',
      ].join(' ');
    }
  }
}
