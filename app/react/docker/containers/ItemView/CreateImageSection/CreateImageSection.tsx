import { Formik } from 'formik';
import { useState } from 'react';
import { ListIcon } from 'lucide-react';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { useAuthorizations } from '@/react/hooks/useUser';
import { notifySuccess } from '@/portainer/services/notifications';
import { useCommitContainerMutation } from '@/react/docker/proxy/queries/useCommitContainerMutation';

import { getDefaultImageConfig } from '@@/ImageConfigFieldset/getImageConfig';
import { Widget } from '@@/Widget';

import { CreateImageForm } from './CreateImageForm';
import { useValidation } from './validation';
import { FormValues } from './types';

interface Props {
  environmentId: EnvironmentId;
  containerId: string;
  onSuccess?(): void;
}

export function CreateImageSection({
  environmentId,
  containerId,
  onSuccess,
}: Props) {
  const mutation = useCommitContainerMutation(environmentId);
  const authorizedQuery = useAuthorizations('DockerImageCreate');
  const [isDockerhubRateLimited, setIsDockerhubRateLimited] = useState(false);

  const validation = useValidation(isDockerhubRateLimited);

  if (!authorizedQuery.authorized) {
    return null;
  }

  const initialValues: FormValues = {
    config: getDefaultImageConfig(),
  };

  return (
    <Widget>
      <Widget.Title icon={ListIcon} title="Create image" />
      <Widget.Body>
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          validationSchema={validation}
          validateOnMount
        >
          <CreateImageForm
            onRateLimit={(limited = false) =>
              setIsDockerhubRateLimited(limited)
            }
            isLoading={mutation.isLoading}
          />
        </Formik>
      </Widget.Body>
    </Widget>
  );

  function handleSubmit({ config }: FormValues) {
    mutation.mutate(
      {
        environmentId,
        containerId,
        image: config.image,
        registryId: config.registryId,
        useRegistry: config.useRegistry,
      },
      {
        onSuccess() {
          notifySuccess('Image created', containerId);
          onSuccess?.();
        },
      }
    );
  }
}
