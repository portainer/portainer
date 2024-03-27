import { FormikErrors } from 'formik';

import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { type AutoUpdateModel } from '@/react/portainer/gitops/types';

import { ButtonSelector } from '@@/form-components/ButtonSelector/ButtonSelector';
import { FormControl } from '@@/form-components/FormControl';
import { SwitchField } from '@@/form-components/SwitchField';
import { TextTip } from '@@/Tip/TextTip';

import { ForceDeploymentSwitch } from './ForceDeploymentSwitch';
import { IntervalField } from './IntervalField';
import { WebhookSettings } from './WebhookSettings';

export function AutoUpdateSettings({
  value,
  onChange,
  environmentType,
  showForcePullImage,
  errors,
  baseWebhookUrl,
  webhookId,
  webhookDocs,
}: {
  value: AutoUpdateModel;
  onChange: (value: Partial<AutoUpdateModel>) => void;
  environmentType?: 'DOCKER' | 'KUBERNETES';
  showForcePullImage: boolean;
  errors?: FormikErrors<AutoUpdateModel>;
  baseWebhookUrl: string;
  webhookId: string;
  webhookDocs?: string;
}) {
  return (
    <>
      <TextTip color="orange" className="mb-2">
        Any changes to this stack or application that have been made locally via
        Portainer or directly in the cluster will be overwritten by the git
        repository content, which may cause service interruption.
      </TextTip>

      <FormControl label="Mechanism">
        <ButtonSelector
          size="small"
          options={[
            { value: 'Interval', label: 'Polling' },
            { value: 'Webhook', label: 'Webhook' },
          ]}
          value={value.RepositoryMechanism || 'Interval'}
          onChange={(value) => onChange({ RepositoryMechanism: value })}
        />
      </FormControl>

      {value.RepositoryMechanism === 'Webhook' && (
        <WebhookSettings
          baseUrl={baseWebhookUrl}
          value={webhookId}
          docsLink={webhookDocs}
        />
      )}

      {value.RepositoryMechanism === 'Interval' && (
        <IntervalField
          value={value.RepositoryFetchInterval || ''}
          onChange={(value) => onChange({ RepositoryFetchInterval: value })}
          errors={errors?.RepositoryFetchInterval}
        />
      )}

      {showForcePullImage && (
        <div className="form-group">
          <div className="col-sm-12">
            <SwitchField
              name="forcePullImage"
              data-cy="gitops-force-pull-image-switch"
              featureId={FeatureId.STACK_PULL_IMAGE}
              checked={value.ForcePullImage || false}
              label="Re-pull image"
              labelClass="col-sm-3 col-lg-2"
              tooltip="If enabled, then when redeploy is triggered via the webhook or polling, if there's a newer image with the tag that you've specified (e.g. changeable development builds), it's pulled and redeployed. If you haven't specified a tag, or have specified 'latest' as the tag, then the image with the tag 'latest' is pulled and redeployed."
              onChange={(value) => onChange({ ForcePullImage: value })}
            />
          </div>
        </div>
      )}

      <ForceDeploymentSwitch
        checked={value.RepositoryAutomaticUpdatesForce || false}
        onChange={(value) =>
          onChange({ RepositoryAutomaticUpdatesForce: value })
        }
        label={
          environmentType === 'KUBERNETES' ? 'Always apply manifest' : undefined
        }
        tooltip={
          environmentType === 'KUBERNETES' ? (
            <>
              <p>
                If enabled, then when redeploy is triggered via the webhook or
                polling, kubectl apply is always performed, even if Portainer
                detects no difference between the git repo and what was stored
                locally on last git pull.
              </p>
              <p>
                This is useful if you want your git repo to be the source of
                truth and are fine with changes made directly to resources in
                the cluster being overwritten.
              </p>
            </>
          ) : undefined
        }
      />
    </>
  );
}
