import { Formik, Form } from 'formik';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';
import { AccessControlForm } from '@/react/portainer/access-control';
import { parseAccessControlFormData } from '@/react/portainer/access-control/utils';
import { NameField } from '@/react/docker/containers/CreateView/BaseForm/NameField';
import { NetworkSelector } from '@/react/docker/containers/components/NetworkSelector';
import { PortsMappingField } from '@/react/docker/containers/CreateView/BaseForm/PortsMappingField';
import { VolumesTab } from '@/react/docker/containers/CreateView/VolumesTab';
import { HostsFileEntries } from '@/react/docker/containers/CreateView/NetworkTab/HostsFileEntries';
import { LabelsTab } from '@/react/docker/containers/CreateView/LabelsTab';
import { HostnameField } from '@/react/docker/containers/CreateView/NetworkTab/HostnameField';

import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';
import { FormActions } from '@@/form-components/FormActions';
import { Button } from '@@/buttons';

import { TemplateViewModel } from '../../view-model';
import { AdvancedSettings } from '../AdvancedSettings';
import { EnvVarsFieldset } from '../EnvVarsFieldset';

import { useValidation } from './useValidation';
import { FormValues } from './types';
import { useCreate } from './useCreate';

export function ContainerDeployForm({
  template,
  unselect,
}: {
  template: TemplateViewModel;
  unselect: () => void;
}) {
  const { user } = useCurrentUser();
  const isEdgeAdminQuery = useIsEdgeAdmin();
  const environmentId = useEnvironmentId();

  const validation = useValidation({
    isAdmin: isEdgeAdminQuery.isAdmin,
    envVarDefinitions: template.Env,
  });

  const createMutation = useCreate(template);

  if (!createMutation || isEdgeAdminQuery.isLoading) {
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
    hostname: '',
    hosts: [],
    labels: [],
    network: '',
    ports: template.Ports.map((p) => ({ ...p, hostPort: p.hostPort || '' })),
    volumes: template.Volumes.map((v) => ({
      containerPath: v.container,
      type: v.type === 'bind' ? 'bind' : 'volume',
      readOnly: v.readonly,
      name: v.type === 'bind' ? v.bind || '' : 'auto',
    })),
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={createMutation.onSubmit}
      validationSchema={validation}
      validateOnMount
    >
      {({ values, errors, setFieldValue, isValid }) => (
        <Form className="form-horizontal">
          <FormSection title="Configuration">
            <NameField
              value={values.name}
              onChange={(v) => setFieldValue('name', v)}
              error={errors.name}
            />

            <FormControl label="Network" errors={errors?.network}>
              <NetworkSelector
                value={values.network}
                onChange={(v) => setFieldValue('network', v)}
              />
            </FormControl>

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

          <AdvancedSettings
            label={(isOpen) =>
              isOpen ? 'Hide advanced options' : 'Show advanced options'
            }
          >
            <PortsMappingField
              value={values.ports}
              onChange={(v) => setFieldValue('ports', v)}
              errors={errors.ports}
            />

            <VolumesTab
              onChange={(v) => setFieldValue('volumes', v)}
              values={values.volumes}
              errors={errors.volumes}
              allowAuto
            />

            <HostsFileEntries
              values={values.hosts}
              onChange={(v) => setFieldValue('hosts', v)}
              errors={errors?.hosts}
            />

            <LabelsTab
              values={values.labels}
              onChange={(v) => setFieldValue('labels', v)}
              errors={errors?.labels}
            />

            <HostnameField
              value={values.hostname}
              onChange={(v) => setFieldValue('hostname', v)}
              error={errors.hostname}
            />
          </AdvancedSettings>

          <FormActions
            isLoading={createMutation.isLoading}
            isValid={isValid}
            loadingText="Deployment in progress..."
            submitLabel="Deploy the container"
            data-cy="deploy-container-button"
          >
            <Button
              type="reset"
              onClick={() => unselect()}
              color="default"
              data-cy="cancel-deploy-container-button"
            >
              Hide
            </Button>
          </FormActions>
        </Form>
      )}
    </Formik>
  );
}
