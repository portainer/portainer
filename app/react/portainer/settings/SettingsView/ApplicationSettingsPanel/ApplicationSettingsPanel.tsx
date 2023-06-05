import { Settings as SettingsIcon } from 'lucide-react';
import { Field, Form, Formik, useFormikContext } from 'formik';

import { EdgeCheckinIntervalField } from '@/react/edge/components/EdgeCheckInIntervalField';
import {
  useSettings,
  useUpdateSettingsMutation,
} from '@/react/portainer/settings/queries';
import { notifySuccess } from '@/portainer/services/notifications';
import { useIsDemo } from '@/react/portainer/system/useSystemStatus';

import { Widget } from '@@/Widget';
import { LoadingButton } from '@@/buttons';
import { SwitchField } from '@@/form-components/SwitchField';
import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

import { type Settings } from '../../types';

import { validation } from './validation';
import { Values } from './types';
import { LogoFieldset } from './LogoFieldset';
import { ScreenBannerFieldset } from './ScreenBannerFieldset';
import { TemplatesUrlSection } from './TemplatesUrlSection';
import { DemoAlert } from './DemoAlert';

export function ApplicationSettingsPanel({
  onSuccess,
}: {
  onSuccess(settings: Settings): void;
}) {
  const settingsQuery = useSettings();
  const mutation = useUpdateSettingsMutation();

  if (!settingsQuery.data) {
    return null;
  }

  const settings = settingsQuery.data;
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
    <div className="row">
      <div className="col-sm-12">
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
      </div>
    </div>
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
  const isDemoQuery = useIsDemo();

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
          value={values.snapshotInterval}
          id="snapshot_interval"
          placeholder="e.g. 15m"
          name="snapshotInterval"
        />
      </FormControl>

      <EdgeCheckinIntervalField
        size="xsmall"
        value={values.edgeAgentCheckinInterval}
        label="Edge agent default poll frequency"
        isDefaultHidden
        onChange={(value) => setFieldValue('edgeAgentCheckinInterval', value)}
      />

      <LogoFieldset />

      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            labelClass="col-sm-2"
            label="Allow the collection of anonymous statistics"
            checked={values.enableTelemetry}
            name="toggle_enableTelemetry"
            onChange={(checked) => setFieldValue('enableTelemetry', checked)}
            disabled={isDemoQuery.data}
          />
        </div>

        <DemoAlert />

        <div className="col-sm-12 text-muted small mt-2">
          You can find more information about this in our{' '}
          <a
            href="https://www.portainer.io/documentation/in-app-analytics-and-privacy-policy/"
            target="_blank"
            rel="noreferrer"
          >
            privacy policy
          </a>
          .
        </div>
      </div>

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
