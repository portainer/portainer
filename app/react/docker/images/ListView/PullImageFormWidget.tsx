import { DownloadIcon } from 'lucide-react';
import { Formik } from 'formik';
import { useState } from 'react';

import { useAuthorizations } from '@/react/hooks/useUser';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { notifySuccess } from '@/portainer/services/notifications';

import { Widget } from '@@/Widget';
import { getDefaultImageConfig } from '@@/ImageConfigFieldset/getImageConfig';

import { usePullImageMutation } from '../queries/usePullImageMutation';

import { FormValues } from './PullImageFormWidget.types';
import { PullImageForm } from './PullImageFormWidget.Form';
import { useValidation } from './PullImageFormWidget.validation';

export function PullImageFormWidget({
  isNodeVisible,
}: {
  isNodeVisible: boolean;
}) {
  const envId = useEnvironmentId();
  const mutation = usePullImageMutation(envId);
  const authorizedQuery = useAuthorizations('DockerImageCreate');
  const [isDockerhubRateLimited, setIsDockerhubRateLimited] = useState(false);

  const validation = useValidation(isDockerhubRateLimited, isNodeVisible);

  if (!authorizedQuery.authorized) {
    return null;
  }

  const initialValues: FormValues = {
    node: '',
    config: getDefaultImageConfig(),
  };

  return (
    <Widget>
      <Widget.Title icon={DownloadIcon} title="Pull image" />
      <Widget.Body>
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          validation={validation}
          validateOnMount
        >
          <PullImageForm
            onRateLimit={(limited = false) =>
              setIsDockerhubRateLimited(limited)
            }
            isLoading={mutation.isLoading}
            isNodeVisible={isNodeVisible}
          />
        </Formik>
      </Widget.Body>
    </Widget>
  );

  function handleSubmit({ config, node }: FormValues) {
    mutation.mutate(
      {
        environmentId: envId,
        image: config.image,
        nodeName: node,
        registryId: config.registryId,
        ignoreErrors: false,
      },
      {
        onSuccess() {
          notifySuccess('Image successfully pulled', config.image);
        },
      }
    );
  }
}
