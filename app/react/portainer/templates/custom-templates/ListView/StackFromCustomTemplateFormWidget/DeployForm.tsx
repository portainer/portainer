import { useRouter } from '@uirouter/react';
import { Formik, Form } from 'formik';

import { notifySuccess } from '@/portainer/services/notifications';
import {
  CreateStackPayload,
  useCreateStack,
} from '@/react/common/stacks/queries/useCreateStack/useCreateStack';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';
import { AccessControlForm } from '@/react/portainer/access-control';
import { parseAccessControlFormData } from '@/react/portainer/access-control/utils';
import { NameField } from '@/react/common/stacks/CreateView/NameField';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';
import {
  isTemplateVariablesEnabled,
  renderTemplate,
} from '@/react/portainer/custom-templates/components/utils';
import {
  CustomTemplatesVariablesField,
  getVariablesFieldDefaultValues,
} from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';
import { StackType } from '@/react/common/stacks/types';
import { toGitFormModel } from '@/react/portainer/gitops/types';
import { AdvancedSettings } from '@/react/portainer/templates/app-templates/DeployFormWidget/AdvancedSettings';
import { useSwarmId } from '@/react/docker/proxy/queries/useSwarm';

import { Button } from '@@/buttons';
import { FormActions } from '@@/form-components/FormActions';
import { FormSection } from '@@/form-components/FormSection';
import { WebEditorForm } from '@@/WebEditorForm';
import { Link } from '@@/Link';

import { FormValues } from './types';
import { useValidation } from './useValidation';

export function DeployForm({
  template,
  templateFile,
  isDeployable,
}: {
  template: CustomTemplate;
  templateFile: string;
  isDeployable: boolean;
}) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const isEdgeAdminQuery = useIsEdgeAdmin();
  const environmentId = useEnvironmentId();
  const swarmIdQuery = useSwarmId(environmentId);
  const mutation = useCreateStack();
  const validation = useValidation({
    isDeployable,
    variableDefs: template.Variables,
    isAdmin: isEdgeAdminQuery.isAdmin,
    environmentId,
  });

  if (isEdgeAdminQuery.isLoading) {
    return null;
  }

  const isGit = !!template.GitConfig;

  const initialValues: FormValues = {
    name: '',
    variables: getVariablesFieldDefaultValues(template.Variables),
    accessControl: parseAccessControlFormData(
      isEdgeAdminQuery.isAdmin,
      user.Id
    ),
    fileContent: templateFile,
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validation}
      validateOnMount
    >
      {({ values, errors, setFieldValue, isValid }) => (
        <Form className="form-horizontal">
          <FormSection title="Configuration">
            <NameField
              value={values.name}
              onChange={(v) => setFieldValue('name', v)}
              errors={errors.name}
              placeholder="e.g. mystack"
            />
          </FormSection>

          {isTemplateVariablesEnabled && (
            <CustomTemplatesVariablesField
              definitions={template.Variables}
              onChange={(v) => {
                setFieldValue('variables', v);
                const newFile = renderTemplate(
                  templateFile,
                  v,
                  template.Variables
                );
                setFieldValue('fileContent', newFile);
              }}
              value={values.variables}
              errors={errors.variables}
            />
          )}

          <AdvancedSettings
            label={(isOpen) => advancedSettingsLabel(isOpen, isGit)}
          >
            <WebEditorForm
              id="custom-template-creation-editor"
              value={values.fileContent}
              onChange={(value) => {
                if (isGit) {
                  return;
                }
                setFieldValue('fileContent', value);
              }}
              yaml
              error={errors.fileContent}
              placeholder="Define or paste the content of your docker compose file here"
              readonly={isGit}
              data-cy="custom-template-creation-editor"
            >
              <p>
                You can get more information about Compose file format in the{' '}
                <a
                  href="https://docs.docker.com/compose/compose-file/"
                  target="_blank"
                  rel="noreferrer"
                >
                  official documentation
                </a>
                .
              </p>
            </WebEditorForm>
          </AdvancedSettings>

          <AccessControlForm
            formNamespace="accessControl"
            onChange={(values) => setFieldValue('accessControl', values)}
            values={values.accessControl}
            errors={errors.accessControl}
            environmentId={environmentId}
          />

          <FormActions
            isLoading={mutation.isLoading}
            isValid={isValid}
            loadingText="Deployment in progress..."
            submitLabel="Deploy the stack"
            data-cy="deploy-stack-button"
          >
            <Button
              type="reset"
              as={Link}
              props={{
                to: '.',
                params: { template: null },
              }}
              color="default"
              data-cy="cancel-stack-creation"
            >
              Hide
            </Button>
          </FormActions>
        </Form>
      )}
    </Formik>
  );

  function handleSubmit(values: FormValues) {
    const payload = getPayload(values);

    return mutation.mutate(payload, {
      onSuccess() {
        notifySuccess('Success', 'Stack created');
        router.stateService.go('docker.stacks');
      },
    });
  }

  function getPayload(values: FormValues): CreateStackPayload {
    const type =
      template.Type === StackType.DockerCompose ? 'standalone' : 'swarm';
    const isGit = !!template.GitConfig;
    if (isGit) {
      return type === 'standalone'
        ? {
            type,
            method: 'git',
            payload: {
              name: values.name,
              environmentId,
              git: toGitFormModel(template.GitConfig),
              accessControl: values.accessControl,
            },
          }
        : {
            type,
            method: 'git',
            payload: {
              name: values.name,
              environmentId,
              swarmId: swarmIdQuery.data || '',
              git: toGitFormModel(template.GitConfig),
              accessControl: values.accessControl,
            },
          };
    }

    return type === 'standalone'
      ? {
          type,
          method: 'string',
          payload: {
            name: values.name,
            environmentId,
            fileContent: values.fileContent,
            accessControl: values.accessControl,
          },
        }
      : {
          type,
          method: 'string',
          payload: {
            name: values.name,
            environmentId,
            swarmId: swarmIdQuery.data || '',
            fileContent: values.fileContent,
            accessControl: values.accessControl,
          },
        };
  }
}

function advancedSettingsLabel(isOpen: boolean, isGit: boolean) {
  if (isGit) {
    return isOpen ? 'Hide stack' : 'View stack';
  }

  return isOpen ? 'Hide custom stack' : 'Customize stack';
}
