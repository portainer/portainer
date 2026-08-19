import { Form, useFormikContext } from 'formik';

import { AccessControlForm } from '@/react/portainer/access-control/AccessControlForm';
import { NameField } from '@/react/docker/stacks/common/NameField';
import { useDockerComposeSchema } from '@/react/hooks/useDockerComposeSchema/useDockerComposeSchema';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';

import { BoxSelector } from '@@/BoxSelector';
import { LoadingButton } from '@@/buttons';
import { FormSection } from '@@/form-components/FormSection';
import { StackEnvironmentVariablesPanel } from '@@/form-components/EnvironmentVariablesFieldset';
import {
  editor,
  upload,
  git,
  customTemplate,
} from '@@/BoxSelector/common-options/build-methods';

import { WebhookFieldset } from '../../common/WebhookFieldset';

import { EditorSection } from './EditorSection/EditorSection';
import { UploadSection } from './UploadSection/UploadSection';
import { GitSection } from './GitSection/GitSection';
import { TemplateSection } from './TemplateSection/TemplateSection';
import { DeploymentInfo } from './DeploymentInfo';
import { FormValues } from './types';

const buildMethods = [editor, upload, git, customTemplate];

export function CreateStackInnerForm({
  isSwarm = false,
  isDeploying,
  isSaved,
  webhookId,
}: {
  isSwarm: boolean | undefined;
  isDeploying: boolean;
  isSaved: boolean;
  webhookId: string;
}) {
  const environmentQuery = useCurrentEnvironment();
  const schemaQuery = useDockerComposeSchema();
  const formikContext = useFormikContext<FormValues>();
  const { errors, values, setFieldValue, isValid } = formikContext;

  if (!environmentQuery.data) {
    return null;
  }

  const environment = environmentQuery.data;

  const dockerComposeSchema = schemaQuery.data;
  const composeSyntaxMaxVersion = environment?.ComposeSyntaxMaxVersion
    ? parseInt(environment.ComposeSyntaxMaxVersion, 10)
    : undefined;

  return (
    <Form className="form-horizontal">
      <NameField
        value={values.name}
        onChange={(name) => setFieldValue('name', name)}
        placeholder="e.g. mystack"
        errors={errors.name}
      />

      <DeploymentInfo
        isSwarm={isSwarm}
        composeSyntaxMaxVersion={composeSyntaxMaxVersion}
      />

      <FormSection title="Build method">
        <BoxSelector
          radioName="build-method"
          value={values.method}
          onChange={(method) => setFieldValue('method', method)}
          options={buildMethods}
          slim
        />
      </FormSection>

      {values.method === 'upload' && <UploadSection isSwarm={isSwarm} />}

      {values.method === 'repository' && (
        <GitSection isDockerStandalone={!isSwarm} webhookId={webhookId} />
      )}

      {values.method === 'template' && (
        <TemplateSection
          isSwarm={isSwarm}
          schema={dockerComposeSchema}
          isSaved={isSaved}
        />
      )}

      {values.method === 'editor' && (
        <EditorSection
          schema={dockerComposeSchema}
          isSwarm={isSwarm}
          isSaved={isSaved}
        />
      )}

      {values.method !== 'repository' && (
        <WebhookFieldset
          value={values.enableWebhook}
          onChange={(value) => setFieldValue('enableWebhook', value)}
          webhookId={webhookId}
        />
      )}

      <StackEnvironmentVariablesPanel
        values={values.env}
        onChange={(env) => setFieldValue('env', env)}
        errors={errors.env}
      />

      <AccessControlForm
        values={values.accessControl}
        onChange={(accessControl) =>
          setFieldValue('accessControl', accessControl)
        }
        environmentId={environment.Id}
        errors={errors.accessControl}
      />

      <FormSection title="Actions">
        <LoadingButton
          loadingText="Deployment in progress..."
          isLoading={isDeploying}
          disabled={!isValid}
          className="!ml-0"
          data-cy="create-stack-submit-btn"
        >
          Deploy the stack
        </LoadingButton>
      </FormSection>
    </Form>
  );
}
