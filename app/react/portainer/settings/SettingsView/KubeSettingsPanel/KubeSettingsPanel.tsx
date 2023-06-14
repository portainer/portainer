import { Form, Formik, useField, useFormikContext } from 'formik';
import { Settings as SettingsIcon } from 'lucide-react';
import { useQueryClient } from 'react-query';

import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { isLimitedToBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { notifySuccess } from '@/portainer/services/notifications';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { LoadingButton } from '@@/buttons';
import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';
import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { PortainerSelect } from '@@/form-components/PortainerSelect';
import { Widget } from '@@/Widget';
import { SwitchField } from '@@/form-components/SwitchField';

import { useToggledValue } from '../ApplicationSettingsPanel/useToggledValue';
import { useSettings, useUpdateSettingsMutation } from '../../queries';

interface FormValues {
  helmRepositoryURL: string;
  kubeconfigExpiry: string;
  globalDeploymentOptions: {
    hideAddWithForm: boolean;
    perEnvOverride: boolean;
    hideWebEditor: boolean;
    hideFileUpload: boolean;
    requireNoteOnApplications: boolean;
    minApplicationNoteLength: number;
  };
}

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
            <Formik initialValues={initialValues} onSubmit={handleSubmit}>
              {() => (
                <Form className="form-horizontal">
                  <HelmSection />
                  <KubeConfigSection />
                  <DeploymentOptionsSection />

                  <div className="form-group">
                    <div className="col-sm-12">
                      <LoadingButton isLoading={false} loadingText="Saving">
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

function HelmSection() {
  const [{ value, onChange, name, onBlur }, { error }] =
    useField<string>('helmRepositoryURL');

  return (
    <FormSection title="Helm Repository">
      <TextTip color="blue">
        You can specify the URL to your own helm repository here. See the{' '}
        <a
          href="https://helm.sh/docs/topics/chart_repository/"
          target="_blank"
          rel="noreferrer"
        >
          official documentation
        </a>{' '}
        for more details.
      </TextTip>

      <FormControl label="URL" errors={error} inputId="helm-repo-url">
        <Input
          id="helm-repo-url"
          name={name}
          placeholder="https://charts.bitnami.com/bitnami"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
        />
      </FormControl>
    </FormSection>
  );
}

const expiryOptions = [
  {
    label: '1 day',
    value: '24h',
  },
  {
    label: '7 days',
    value: `${24 * 7}h`,
  },
  {
    label: '30 days',
    value: `${24 * 30}h`,
  },
  {
    label: '1 year',
    value: `${24 * 30 * 12}h`,
  },
  {
    label: 'No expiry',
    value: '0',
  },
] as const;

function KubeConfigSection() {
  const [{ value }, { error }, { setValue }] =
    useField<string>('kubeconfigExpiry');

  return (
    <FormSection title="Kubeconfig">
      <FormControl label="Kubeconfig expiry" errors={error}>
        <PortainerSelect
          value={value}
          options={expiryOptions}
          onChange={(value) => value && setValue(value)}
        />
      </FormControl>
    </FormSection>
  );
}

function DeploymentOptionsSection() {
  const {
    values: { globalDeploymentOptions: values },
    setFieldValue,
  } = useFormikContext<FormValues>();
  const limitedFeature = isLimitedToBE(FeatureId.ENFORCE_DEPLOYMENT_OPTIONS);
  return (
    <FormSection title="Deployment Options">
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            label="Enforce code-based deployment"
            checked={values.hideAddWithForm}
            name="toggle_hideAddWithForm"
            featureId={FeatureId.ENFORCE_DEPLOYMENT_OPTIONS}
            onChange={(value) => handleToggleAddWithForm(value)}
            labelClass="col-sm-3 col-lg-2"
            tooltip="'Hides the 'Add with form' buttons and prevents adding/editing of resources via forms'"
          />
        </div>
      </div>
      {values.hideAddWithForm && (
        <div className="form-group flex flex-col gap-y-1">
          <div className="col-sm-12">
            <SwitchField
              label="Allow web editor and custom template use"
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
    </FormSection>
  );

  async function handleToggleAddWithForm(checked: boolean) {
    await setFieldValue('globalDeploymentOptions.hideWebEditor', checked);
    await setFieldValue('globalDeploymentOptions.hideFileUpload', checked);
    await setFieldValue('globalDeploymentOptions.hideAddWithForm', checked);
  }
}

export function KubeNoteMinimumCharacters() {
  const [{ value }, { error }, { setValue }] = useField<number>(
    'minApplicationNoteLength'
  );
  const [isEnabled, setIsEnabled] = useToggledValue(
    'globalDeploymentOptions.minApplicationNoteLength',
    'globalDeploymentOptions.requireNoteOnApplications'
  );

  return (
    <>
      <div className="form-group">
        <SwitchField
          label="Require a note on applications"
          checked={isEnabled}
          name="toggle_requireNoteOnApplications"
          onChange={(value) => setIsEnabled(value)}
          fieldClass="col-sm-12"
          labelClass="col-sm-2"
          tooltip="Using this will enforce entry of a note in Add/Edit application (and prevent complete clearing of it in Application details)."
        />
      </div>
      {isEnabled && (
        <FormControl
          label={
            <span className="pl-4">
              Minimum number of characters note must have
            </span>
          }
          errors={error}
        >
          <Input
            name="minNoteLength"
            type="number"
            placeholder="50"
            min="1"
            max="9999"
            value={value}
            onChange={(e) => setValue(e.target.valueAsNumber)}
            className="w-1/4"
          />
        </FormControl>
      )}
    </>
  );
}
