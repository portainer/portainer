import { Formik } from 'formik';
import { useRouter } from '@uirouter/react';
import { useEffect, useState } from 'react';

import { useIsEdgeAdmin, useIsEnvironmentAdmin } from '@/react/hooks/useUser';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { useEnvironmentRegistries } from '@/react/portainer/environments/queries/useEnvironmentRegistries';
import { Registry } from '@/react/portainer/registries/types/registry';
import { notifySuccess } from '@/portainer/services/notifications';
import { useAnalytics } from '@/react/hooks/useAnalytics';
import { useDebouncedValue } from '@/react/hooks/useDebouncedValue';

import { PageHeader } from '@@/PageHeader';
import { ImageConfigValues } from '@@/ImageConfigFieldset';
import { confirmDestructive } from '@@/modals/confirm';
import { buildConfirmButton } from '@@/modals/utils';
import { InformationPanel } from '@@/InformationPanel';
import { TextTip } from '@@/Tip/TextTip';

import { useContainers } from '../queries/containers';
import { useSystemLimits } from '../../proxy/queries/useInfo';

import { useCreateOrReplaceMutation } from './useCreateMutation';
import { useValidation } from './validation';
import { useInitialValues, Values } from './useInitialValues';
import { InnerForm } from './InnerForm';
import { toRequest } from './toRequest';

export function CreateView() {
  return (
    <>
      <PageHeader
        title="Create container"
        breadcrumbs={[
          { label: 'Containers', link: 'docker.containers' },
          'Add container',
        ]}
        reload
      />

      <CreateForm />
    </>
  );
}

function CreateForm() {
  const environmentId = useEnvironmentId();
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const isAdminQuery = useIsEdgeAdmin();
  const { authorized: isEnvironmentAdmin } = useIsEnvironmentAdmin();
  const [isDockerhubRateLimited, setIsDockerhubRateLimited] = useState(false);

  const mutation = useCreateOrReplaceMutation();
  const initialValuesQuery = useInitialValues(
    mutation.isLoading || mutation.isSuccess
  );
  const registriesQuery = useEnvironmentRegistries(environmentId);

  const { oldContainer, syncName } = useOldContainer(
    initialValuesQuery?.initialValues?.name
  );

  const { maxCpu, maxMemory } = useSystemLimits(environmentId);

  const envQuery = useCurrentEnvironment();

  const validationSchema = useValidation({
    isAdmin: isAdminQuery.isAdmin,
    maxCpu,
    maxMemory,
    isDuplicating: initialValuesQuery?.isDuplicating,
    isDuplicatingPortainer: oldContainer?.IsPortainer,
    isDockerhubRateLimited,
  });

  if (!envQuery.data || !initialValuesQuery) {
    return null;
  }

  const environment = envQuery.data;

  const hideCapabilities =
    !environment.SecuritySettings.allowContainerCapabilitiesForRegularUsers &&
    !isEnvironmentAdmin;

  const {
    isDuplicating = false,
    initialValues,
    extraNetworks,
  } = initialValuesQuery;

  return (
    <>
      {isDuplicating && (
        <InformationPanel title-text="Caution">
          <TextTip>
            The new container may fail to start if the image is changed, and
            settings from the previous container aren&apos;t compatible. Common
            causes include entrypoint, cmd or
            <a
              href="https://docs.portainer.io/user/docker/containers/advanced"
              target="_blank"
              rel="noreferrer"
            >
              other settings
            </a>{' '}
            set by an image.
          </TextTip>
        </InformationPanel>
      )}

      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validateOnMount
        validationSchema={validationSchema}
      >
        <InnerForm
          hideCapabilities={hideCapabilities}
          onChangeName={syncName}
          isDuplicate={isDuplicating}
          isLoading={mutation.isLoading}
          onRateLimit={(limited = false) => setIsDockerhubRateLimited(limited)}
        />
      </Formik>
    </>
  );

  async function handleSubmit(values: Values) {
    if (oldContainer) {
      const confirmed = await confirmDestructive({
        title: 'Are you sure?',
        message:
          'A container with the same name already exists. Portainer can automatically remove it and re-create one. Do you want to replace it?',
        confirmButton: buildConfirmButton('Replace', 'danger'),
      });

      if (!confirmed) {
        return false;
      }
    }

    const registry = getRegistry(values.image, registriesQuery.data || []);
    const config = toRequest(values, registry, hideCapabilities);

    return mutation.mutate(
      { config, environment, values, registry, oldContainer, extraNetworks },
      {
        onSuccess() {
          sendAnalytics(values, registry);
          notifySuccess('Success', 'Container successfully created');
          router.stateService.go('docker.containers');
        },
      }
    );
  }

  function sendAnalytics(values: Values, registry?: Registry) {
    const containerImage = registry?.URL
      ? `${registry?.URL}/${values.image}`
      : values.image;
    if (values.resources.gpu.enabled) {
      trackEvent('gpuContainerCreated', {
        category: 'docker',
        metadata: { gpu: values.resources.gpu, containerImage },
      });
    }
  }
}

function getRegistry(image: ImageConfigValues, registries: Registry[]) {
  return image.useRegistry
    ? registries.find((registry) => registry.Id === image.registryId)
    : undefined;
}

function useOldContainer(initialName?: string) {
  const environmentId = useEnvironmentId();

  const [name, setName] = useState(initialName);
  const debouncedName = useDebouncedValue(name, 1000);
  const oldContainerQuery = useContainers(environmentId, {
    enabled: !!debouncedName,
    filters: {
      name: [`^/${debouncedName}$`],
    },
  });
  useEffect(() => {
    if (initialName && initialName !== name) {
      setName(initialName);
    }
  }, [initialName, name]);

  return {
    syncName: setName,
    oldContainer:
      oldContainerQuery.data && oldContainerQuery.data.length > 0
        ? oldContainerQuery.data[0]
        : undefined,
  };
}
