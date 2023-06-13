import { FormikErrors } from 'formik';

import { AutoUpdateModel } from '@/react/portainer/gitops/types';

import { SwitchField } from '@@/form-components/SwitchField';
import { TextTip } from '@@/Tip/TextTip';

import { AutoUpdateSettings } from './AutoUpdateSettings';

export function AutoUpdateFieldset({
  value,
  onChange,
  environmentType,
  isForcePullVisible = true,
  errors,
  baseWebhookUrl,
  webhookId,
  webhooksDocs,
}: {
  value: AutoUpdateModel;
  onChange: (value: AutoUpdateModel) => void;
  environmentType?: 'DOCKER' | 'KUBERNETES';
  isForcePullVisible?: boolean;
  errors?: FormikErrors<AutoUpdateModel>;
  baseWebhookUrl: string;
  webhookId: string;
  webhooksDocs?: string;
}) {
  return (
    <>
      <div className="form-group">
        <div className="col-sm-12">
          <TextTip color="blue" className="mb-2">
            When enabled, at each polling interval or webhook invocation, if the
            git repo differs from what was stored locally on the last git pull,
            the changes are deployed.
          </TextTip>
          <SwitchField
            name="autoUpdate"
            checked={!!value.RepositoryAutomaticUpdates}
            label="GitOps updates"
            labelClass="col-sm-3 col-lg-2"
            onChange={(value) =>
              handleChange({ RepositoryAutomaticUpdates: value })
            }
          />
        </div>
      </div>

      {value.RepositoryAutomaticUpdates && (
        <AutoUpdateSettings
          webhookId={webhookId}
          baseWebhookUrl={baseWebhookUrl}
          value={value}
          onChange={handleChange}
          environmentType={environmentType}
          showForcePullImage={isForcePullVisible}
          errors={errors}
          webhookDocs={webhooksDocs}
        />
      )}
    </>
  );

  function handleChange(newValues: Partial<AutoUpdateModel>) {
    onChange({ ...value, ...newValues });
  }
}
