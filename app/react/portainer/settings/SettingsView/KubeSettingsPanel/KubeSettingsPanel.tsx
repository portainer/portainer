import { Form, Formik } from 'formik';
import { Settings as SettingsIcon } from 'lucide-react';
import { useQueryClient } from 'react-query';

import { notifySuccess } from '@/portainer/services/notifications';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { LoadingButton } from '@@/buttons';
import { Widget } from '@@/Widget';

import { useSettings, useUpdateSettingsMutation } from '../../queries';

import { HelmSection } from './HelmSection';
import { KubeConfigSection } from './KubeConfigSection';
import { FormValues } from './types';
import { DeploymentOptionsSection } from './DeploymentOptionsSection';
import { validation } from './validation';

export function KubeSettingsPanel() {
  const settingsQuery = useSettings();
  const queryClient = useQueryClient();
  const environmentId = useEnvironmentId(false);
  const mutation = useUpdateSettingsMutation();

  if (!settingsQuery.data) {
    return null;
  }

  const initialValues: FormValues = {
    helmRepositoryURL: settingsQuery.data.HelmRepositoryURL || '',
    kubeconfigExpiry: settingsQuery.data.KubeconfigExpiry || '0',
    globalDeploymentOptions: settingsQuery.data.GlobalDeploymentOptions,
  };

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <Widget.Title icon={SettingsIcon} title="Kubernetes settings" />
          <Widget.Body>
            <Formik
              initialValues={initialValues}
              onSubmit={handleSubmit}
              validationSchema={validation}
              validateOnMount
            >
              {() => (
                <Form className="form-horizontal">
                  <HelmSection />
                  <KubeConfigSection />
                  <DeploymentOptionsSection />

                  <div className="form-group">
                    <div className="col-sm-12">
                      <LoadingButton
                        isLoading={mutation.isLoading}
                        loadingText="Saving"
                        className="!ml-0"
                      >
                        Save Kubernetes Settings
                      </LoadingButton>
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </Widget.Body>
        </Widget>
      </div>
    </div>
  );

  function handleSubmit(values: FormValues) {
    mutation.mutate(
      {
        HelmRepositoryURL: values.helmRepositoryURL,
        KubeconfigExpiry: values.kubeconfigExpiry,
        GlobalDeploymentOptions: {
          ...values.globalDeploymentOptions,
          requireNoteOnApplications:
            values.globalDeploymentOptions.requireNoteOnApplications,
          minApplicationNoteLength: values.globalDeploymentOptions
            .requireNoteOnApplications
            ? values.globalDeploymentOptions.minApplicationNoteLength
            : 0,
        },
      },
      {
        async onSuccess() {
          if (environmentId) {
            await queryClient.invalidateQueries([
              'environments',
              environmentId,
              'deploymentOptions',
            ]);
          }
          notifySuccess('Success', 'Kubernetes settings updated');
        },
      }
    );
  }
}
