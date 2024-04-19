import { useRouter } from '@uirouter/react';
import { Formik, Form } from 'formik';

import { notifySuccess } from '@/portainer/services/notifications';
import {
  SwarmCreatePayload,
  useCreateStack,
} from '@/react/common/stacks/queries/useCreateStack/useCreateStack';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';
import { AccessControlForm } from '@/react/portainer/access-control';
import { parseAccessControlFormData } from '@/react/portainer/access-control/utils';
import { TemplateType } from '@/react/portainer/templates/app-templates/types';
import { TemplateViewModel } from '@/react/portainer/templates/app-templates/view-model';
import { NameField } from '@/react/common/stacks/CreateView/NameField';
import { useSwarmId } from '@/react/docker/proxy/queries/useSwarm';

import { Button } from '@@/buttons';
import { FormActions } from '@@/form-components/FormActions';
import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';

import { EnvVarsFieldset } from '../EnvVarsFieldset';

import { FormValues } from './types';
import { useValidation } from './useValidation';
import { useIsDeployable } from './useIsDeployable';

export function StackDeployForm({
  template,
  unselect,
}: {
  template: TemplateViewModel;
  unselect: () => void;
}) {
  const isDeployable = useIsDeployable(template.Type);

  const router = useRouter();
  const isEdgeAdminQuery = useIsEdgeAdmin();

  const { user } = useCurrentUser();
  const environmentId = useEnvironmentId();
  const swarmIdQuery = useSwarmId(environmentId);
  const mutation = useCreateStack();
  const validation = useValidation({
    isAdmin: isEdgeAdminQuery.isAdmin,
    environmentId,
    envVarDefinitions: template.Env,
  });

  if (isEdgeAdminQuery.isLoading) {
    return null;
  }

  const initialValues: FormValues = {
    name: template.Name || '',
    envVars:
      Object.fromEntries(template.Env?.map((env) => [env.name, env.value])) ||
      {},
    accessControl: parseAccessControlFormData(
      isEdgeAdminQuery.isAdmin,
      user.Id
    ),
  };

  if (!isDeployable) {
    return (
      <div className="form-group">
        <TextTip>
          This template type cannot be deployed on this environment.
        </TextTip>
      </div>
    );
  }

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
            />

            <EnvVarsFieldset
              values={values.envVars}
              onChange={(values) => setFieldValue('envVars', values)}
              errors={errors.envVars}
              options={template.Env || []}
            />
          </FormSection>

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
              onClick={() => unselect()}
              color="default"
              data-cy="cancel-deploy-stack-button"
            >
              Hide
            </Button>
          </FormActions>
        </Form>
      )}
    </Formik>
  );

  function handleSubmit(values: FormValues) {
    const type =
      template.Type === TemplateType.ComposeStack ? 'standalone' : 'swarm';
    const payload: SwarmCreatePayload['payload'] = {
      name: values.name,
      environmentId,

      env: Object.entries(values.envVars).map(([name, value]) => ({
        name,
        value,
      })),
      swarmId: swarmIdQuery.data || '',
      git: {
        RepositoryURL: template.Repository.url,
        ComposeFilePathInRepository: template.Repository.stackfile,
      },
      fromAppTemplate: true,
      accessControl: values.accessControl,
    };

    return mutation.mutate(
      {
        type,
        method: 'git',
        payload,
      },
      {
        onSuccess() {
          notifySuccess('Success', 'Stack created');
          router.stateService.go('docker.stacks');
        },
      }
    );
  }
}
