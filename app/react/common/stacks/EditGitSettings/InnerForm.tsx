import { Settings } from 'lucide-react';
import { Form, useFormikContext } from 'formik';

import { StackType } from '@/react/common/stacks/types';
import { baseStackWebhookUrl } from '@/portainer/helpers/webhookHelper';
import { GitForm } from '@/react/portainer/gitops/GitForm';
import { useIsStandalone } from '@/react/docker/proxy/queries/useInfo';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { getPlatformType } from '@/react/portainer/environments/utils';
import { PlatformType } from '@/react/portainer/environments/types';
import { StackName } from '@/react/kubernetes/DeployView/StackName/StackName';

import { Modal } from '@@/modals/Modal';
import { TextTip } from '@@/Tip/TextTip';
import { Button, LoadingButton } from '@@/buttons';
import { WidgetIcon } from '@@/Widget/WidgetIcon';
import { Checkbox } from '@@/form-components/Checkbox';
import { StackEnvironmentVariablesPanel } from '@@/form-components/EnvironmentVariablesFieldset';

import { PruneField } from '../PruneField';

import { FormValues } from './types';

export function InnerForm({
  stackName,
  stackType,
  onDismiss,
  isSubmitting,
  webhookId,
}: {
  stackName: string;
  stackType: StackType;
  onDismiss: () => void;
  isSubmitting: boolean;
  webhookId: string;
}) {
  const environmentQuery = useCurrentEnvironment();
  const platform = environmentQuery.data
    ? getPlatformType(environmentQuery.data.Type)
    : null;
  const isDocker = platform === PlatformType.Docker;
  const isDockerStandalone = useIsStandalone(environmentQuery.data?.Id, {
    enabled: isDocker,
  });
  const { values, setFieldValue, submitForm, errors } =
    useFormikContext<FormValues>();

  return (
    <Form>
      <Modal
        onDismiss={onDismiss}
        aria-label="edit-git-settings"
        size="xl"
        className="flex h-[80vh] flex-col px-0"
      >
        <Modal.Header
          title={
            <div className="inline-flex items-center gap-1 px-5">
              <WidgetIcon icon={Settings} />
              <h2 className="m-0 ml-1 text-base">
                Edit Git settings — {stackName}
              </h2>
            </div>
          }
        />
        <div className="flex-1 overflow-y-auto px-5">
          <Modal.Body>
            <div className="form-horizontal">
              {stackType === StackType.Kubernetes && (
                <>
                  <StackName
                    stackName={values.kube?.name ?? ''}
                    setStackName={(value) => {
                      setFieldValue('kube.name', value);
                      if (value && value !== stackName) {
                        setFieldValue('redeployNow', true);
                      }
                    }}
                    error={errors.kube?.name}
                  />
                  <TextTip color="blue" className="mb-4">
                    Changing the stack name requires a redeploy to update the
                    deployed resources.
                  </TextTip>
                </>
              )}

              <GitForm
                value={values.git}
                onChange={(partial) => {
                  Object.entries(partial).forEach(([key, val]) => {
                    setFieldValue(`git.${key}`, val);
                  });
                }}
                environmentType={getPlatformNameForGitForm()}
                isForcePullVisible={stackType !== StackType.Kubernetes}
                baseWebhookUrl={baseStackWebhookUrl()}
                webhookId={webhookId}
                webhooksDocs="/user/docker/stacks/webhooks"
                isAuthExplanationVisible
                isAdditionalFilesFieldVisible
                isAutoUpdateVisible
                errors={errors.git}
                deployMethod={
                  stackType === StackType.Kubernetes ? 'manifest' : 'compose'
                }
                isDockerStandalone={isDockerStandalone}
              />

              <StackEnvironmentVariablesPanel
                values={values.env}
                onChange={(value) => setFieldValue('env', value)}
                showHelpMessage
                isFoldable
                errors={errors.env}
              />

              {isDocker && (
                <PruneField
                  stackType={stackType}
                  checked={values.prune}
                  onChange={(value) => setFieldValue('prune', value)}
                />
              )}
            </div>
          </Modal.Body>
        </div>
        <div className="border-0 border-t border-solid border-gray-5 px-5 th-highcontrast:border-white th-dark:border-gray-7">
          <Modal.Footer>
            <div className="flex flex-1 justify-between">
              <Button
                onClick={onDismiss}
                color="secondary"
                key="cancel-button"
                size="medium"
                data-cy="cancel-button"
              >
                Cancel
              </Button>
              <div className="flex items-center gap-4">
                <span className="flex items-center">
                  <Checkbox
                    id="redeploy-checkbox"
                    label="Redeploy"
                    checked={values.redeployNow}
                    onChange={(e) =>
                      setFieldValue('redeployNow', e.target.checked)
                    }
                    data-cy="redeploy-now-checkbox"
                  />
                </span>
                <LoadingButton
                  color="primary"
                  key="save-button"
                  size="medium"
                  onClick={submitForm}
                  isLoading={isSubmitting}
                  loadingText="Saving..."
                  data-cy="save-git-settings-button"
                >
                  Save settings
                </LoadingButton>
              </div>
            </div>
          </Modal.Footer>
        </div>
      </Modal>
    </Form>
  );

  function getPlatformNameForGitForm(): 'DOCKER' | 'KUBERNETES' | undefined {
    if (platform === PlatformType.Docker) {
      return 'DOCKER';
    }

    if (platform === PlatformType.Kubernetes) {
      return 'KUBERNETES';
    }

    return undefined;
  }
}
