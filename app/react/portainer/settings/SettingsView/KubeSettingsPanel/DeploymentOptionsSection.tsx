import { useFormikContext } from 'formik';

import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { isLimitedToBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { FormSection } from '@@/form-components/FormSection';
import { SwitchField } from '@@/form-components/SwitchField';

import { KubeNoteMinimumCharacters } from './KubeNoteMinimumCharacters';
import { FormValues } from './types';

export function DeploymentOptionsSection() {
  const {
    values: { globalDeploymentOptions: values },
    setFieldValue,
  } = useFormikContext<FormValues>();

  const limitedFeature = isLimitedToBE(FeatureId.ENFORCE_DEPLOYMENT_OPTIONS);
  return (
    <FormSection title="Deployment options">
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            label="Enforce code-based deployment"
            data-cy="kube-settings-enforce-code-based-deployment"
            checked={values.hideAddWithForm}
            name="toggle_hideAddWithForm"
            featureId={FeatureId.ENFORCE_DEPLOYMENT_OPTIONS}
            onChange={(value) => handleToggleAddWithForm(value)}
            labelClass="col-sm-3 col-lg-2"
            tooltip="Hides the 'Add with form' buttons and prevents adding/editing of resources via forms"
          />
        </div>
      </div>
      {values.hideAddWithForm && (
        <div className="form-group flex flex-col gap-y-1">
          <div className="col-sm-12">
            <SwitchField
              label="Allow web editor and custom template use"
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
              label="Allow specifying of a manifest via a URL"
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
              label="Allow per environment override"
              data-cy="kube-settings-allow-per-environment-override"
              checked={values.perEnvOverride}
              onChange={(value) =>
                setFieldValue('globalDeploymentOptions.perEnvOverride', value)
              }
              name="toggle_perEnvOverride"
              labelClass="col-sm-3 col-lg-2"
              tooltip="Allows overriding of deployment options in the Cluster setup screen of each environment"
            />
          </div>
        </div>
      )}

      <KubeNoteMinimumCharacters />

      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            label="Allow stacks functionality with Kubernetes environments"
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
            tooltip="This allows you to group your applications/workloads into a single ‘stack’, and then view or delete an entire stack. If disabled, stacks functionality will not show in the UI."
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
