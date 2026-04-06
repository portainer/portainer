import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';

import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { isLimitedToBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { FormSection } from '@@/form-components/FormSection';
import { SwitchField } from '@@/form-components/SwitchField';

import { KubeNoteMinimumCharacters } from './KubeNoteMinimumCharacters';
import { FormValues } from './types';

export function DeploymentOptionsSection() {
  const { t } = useTranslation();
  const {
    values: { globalDeploymentOptions: values },
    setFieldValue,
  } = useFormikContext<FormValues>();

  const limitedFeature = isLimitedToBE(FeatureId.ENFORCE_DEPLOYMENT_OPTIONS);
  return (
    <FormSection title={t('settings.deploy_title')}>
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            label={t('settings.deploy_enforce')}
            data-cy="kube-settings-enforce-code-based-deployment"
            checked={values.hideAddWithForm}
            name="toggle_hideAddWithForm"
            featureId={FeatureId.ENFORCE_DEPLOYMENT_OPTIONS}
            onChange={(value) => handleToggleAddWithForm(value)}
            labelClass="col-sm-3 col-lg-2"
            tooltip={t('settings.deploy_enforce_tooltip')}
          />
        </div>
      </div>
      {values.hideAddWithForm && (
        <div className="form-group flex flex-col gap-y-1">
          <div className="col-sm-12">
            <SwitchField
              label={t('settings.deploy_allow_editor')}
              data-cy="kube-settings-allow-web-editor-and-custom-template-use"
              checked={!values.hideWebEditor}
              name="toggle_hideWebEditor"
              onChange={(value) =>
                setFieldValue('globalDeploymentOptions.hideWebEditor', !value)
              }
              labelClass="col-sm-2 !pl-4"
            />
          </div>
          <div className="col-sm-12">
            <SwitchField
              label={t('settings.deploy_allow_url')}
              data-cy="kube-settings-allow-specifying-of-a-manifest-via-a-url"
              checked={!values.hideFileUpload}
              name="toggle_hideFileUpload"
              onChange={(value) =>
                setFieldValue('globalDeploymentOptions.hideFileUpload', !value)
              }
              labelClass="col-sm-2 !pl-4"
            />
          </div>
        </div>
      )}
      {!limitedFeature && (
        <div className="form-group">
          <div className="col-sm-12">
            <SwitchField
              label={t('settings.deploy_allow_override')}
              data-cy="kube-settings-allow-per-environment-override"
              checked={values.perEnvOverride}
              onChange={(value) =>
                setFieldValue('globalDeploymentOptions.perEnvOverride', value)
              }
              name="toggle_perEnvOverride"
              labelClass="col-sm-3 col-lg-2"
              tooltip={t('settings.deploy_override_tooltip')}
            />
          </div>
        </div>
      )}

      <KubeNoteMinimumCharacters />

      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            label={t('settings.deploy_allow_stacks')}
            data-cy="kube-settings-allow-stacks-functionality"
            checked={!values.hideStacksFunctionality}
            onChange={(value) =>
              setFieldValue(
                'globalDeploymentOptions.hideStacksFunctionality',
                !value
              )
            }
            name="toggle_stacksFunctionality"
            labelClass="col-sm-3 col-lg-2"
            tooltip={t('settings.deploy_stacks_tooltip')}
          />
        </div>
      </div>
    </FormSection>
  );

  async function handleToggleAddWithForm(checked: boolean) {
    await setFieldValue('globalDeploymentOptions.hideWebEditor', checked);
    await setFieldValue('globalDeploymentOptions.hideFileUpload', checked);
    await setFieldValue('globalDeploymentOptions.hideAddWithForm', checked);
  }
}
