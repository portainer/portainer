import { Settings as SettingsIcon } from 'lucide-react';
import { Field, Form, Formik, useFormikContext } from 'formik';

import { EdgeCheckinIntervalField } from '@/react/edge/components/EdgeCheckInIntervalField';
import { useUpdateSettingsMutation } from '@/react/portainer/settings/queries';
import { notifySuccess } from '@/portainer/services/notifications';

import { Widget } from '@@/Widget';
import { LoadingButton } from '@@/buttons';
import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

import { type Settings } from '../../types';

import { validation } from './validation';
import { Values } from './types';
import { LogoFieldset } from './LogoFieldset';
import { ScreenBannerFieldset } from './ScreenBannerFieldset';
import { TemplatesUrlSection } from './TemplatesUrlSection';
import { EnableTelemetryField } from './EnableTelemetryField';

export function ApplicationSettingsPanel({
  onSuccess,
  settings,
}: {
  onSuccess(settings: Settings): void;
  settings: Settings;
}) {
  const mutation = useUpdateSettingsMutation();

  const initialValues: Values = {
    edgeAgentCheckinInterval: settings.EdgeAgentCheckinInterval,
    enableTelemetry: settings.EnableTelemetry,
    loginBannerEnabled: !!settings.CustomLoginBanner,
    loginBanner: settings.CustomLoginBanner,
    logoEnabled: !!settings.LogoURL,
    logo: settings.LogoURL,
    snapshotInterval: settings.SnapshotInterval,
    templatesUrl: settings.TemplatesURL,
  };

  return (
    <Widget>
      <Widget.Title icon={SettingsIcon} title="Application settings" />
      <Widget.Body>
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          validationSchema={validation}
          validateOnMount
        >
          <InnerForm isLoading={mutation.isLoading} />
        </Formik>
      </Widget.Body>
    </Widget>
  );

  function handleSubmit(values: Values) {
    mutation.mutate(
      {
        SnapshotInterval: values.snapshotInterval,
        LogoURL: values.logo,
        EnableTelemetry: values.enableTelemetry,
        CustomLoginBanner: values.loginBanner,
        TemplatesURL: values.templatesUrl,
        EdgeAgentCheckinInterval: values.edgeAgentCheckinInterval,
      },
      {
        onSuccess(settings) {
          notifySuccess('Success', 'Application settings updated');
          onSuccess(settings);
        },
      }
    );
  }
}

function InnerForm({ isLoading }: { isLoading: boolean }) {
  const { values, setFieldValue, isValid, errors } = useFormikContext<Values>();

  return (
    <Form className="form-horizontal">
      <FormControl
        label="Snapshot interval"
        inputId="snapshot_interval"
        errors={errors.snapshotInterval}
        required
      >
        <Field
          as={Input}
          id="snapshot_interval"
          placeholder="e.g. 15m"
          name="snapshotInterval"
        />
      </FormControl>

      <EdgeCheckinIntervalField
        value={values.edgeAgentCheckinInterval}
        label="Edge agent default poll frequency"
        isDefaultHidden
        onChange={(value) => setFieldValue('edgeAgentCheckinInterval', value)}
      />

      <LogoFieldset />

      <EnableTelemetryField />

      <ScreenBannerFieldset />

      <TemplatesUrlSection />

      <div className="form-group">
        <div className="col-sm-12">
          <LoadingButton
            isLoading={isLoading}
            disabled={!isValid}
            data-cy="settings-saveSettingsButton"
            loadingText="Saving..."
          >
            Save application settings
          </LoadingButton>
        </div>
      </div>
    </Form>
  );
}
