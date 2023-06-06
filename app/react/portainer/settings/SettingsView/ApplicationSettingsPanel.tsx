import { Settings } from 'lucide-react';
import { Field, Form, Formik, useField, useFormikContext } from 'formik';
import { SchemaOf, bool, boolean, number, object, string } from 'yup';

import { EdgeCheckinIntervalField } from '@/react/edge/components/EdgeCheckInIntervalField';
import {
  useSettings,
  useUpdateSettingsMutation,
} from '@/react/portainer/settings/queries';
import { notifySuccess } from '@/portainer/services/notifications';

import { Widget } from '@@/Widget';
import { LoadingButton } from '@@/buttons';
import { SwitchField } from '@@/form-components/SwitchField';
import { FormSection } from '@@/form-components/FormSection';
import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { TextArea } from '@@/form-components/Input/Textarea';
import { isValidUrl } from '@@/form-components/validate-url';

import { FeatureId } from '../../feature-flags/enums';

interface Values {
  snapshotInterval: string;
  edgeAgentCheckinInterval: number;
  enableTelemetry: boolean;
  loginBanner: string;
  loginBannerEnabled: boolean;
  logo: string;
  logoEnabled: boolean;
  templatesUrl: string;
}

export function ApplicationSettingsPanel({ onSuccess }: { onSuccess(): void }) {
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
          <Widget.Title icon={Settings} title="Application settings" />
          <Widget.Body>
            <Formik
              initialValues={initialValues}
              onSubmit={handleSubmit}
              validationSchema={validation}
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
        onSuccess() {
          notifySuccess('Success', 'Application settings updated');
          onSuccess();
        },
      }
    );
  }
}

function InnerForm({ isLoading }: { isLoading: boolean }) {
  const { values, setFieldValue, isValid, errors } = useFormikContext<Values>();
  const isDemo = false;
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
            disabled={isDemo}
          />
        </div>

        {isDemo && (
          <div className="col-sm-12 mt-2">
            <span className="small text-muted">
              You cannot use this feature in the demo version of Portainer.
            </span>
          </div>
        )}
        <div className="col-sm-12 text-muted small mt-2">
          You can find more information about this in our
          <a
            href="https://www.portainer.io/documentation/in-app-analytics-and-privacy-policy/"
            target="_blank"
            rel="noreferrer"
          >
            {' '}
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

function LogoFieldset() {
  const [{ name }, { error }] = useField<string>('logo');
  const [, { value: isEnabled }, { setValue: setIsEnabled }] =
    useField<boolean>('logoEnabled');
  const isDemo = false;

  return (
    <>
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            label="Use custom logo"
            checked={isEnabled}
            name="toggle_logo"
            labelClass="col-sm-2"
            disabled={isDemo}
            onChange={(checked) => setIsEnabled(checked)}
          />
        </div>

        {isDemo && (
          <div className="col-sm-12 mt-2">
            <span className="small text-muted">
              You cannot use this feature in the demo version of Portainer.
            </span>
          </div>
        )}
      </div>

      {isEnabled && (
        <div>
          <div className="form-group">
            <span className="col-sm-12 text-muted small">
              You can specify the URL to your logo here. For an optimal display,
              logo dimensions should be 155px by 55px.
            </span>
          </div>
          <FormControl label="URL" inputId="logo_url" errors={error} required>
            <Field
              as={Input}
              name={name}
              id="logo_url"
              placeholder="https://mycompany.com/logo.png"
            />
          </FormControl>
        </div>
      )}
    </>
  );
}

function ScreenBannerFieldset() {
  const [{ name }, { error }] = useField<string>('loginBanner');
  const [, { value: isEnabled }, { setValue: setIsEnabled }] =
    useField<boolean>('loginBannerEnabled');
  const isDemo = false;

  return (
    <>
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            labelClass="col-sm-2"
            label="Login screen banner"
            checked={isEnabled}
            name="toggle_login_banner"
            disabled={isDemo}
            onChange={(checked) => setIsEnabled(checked)}
            featureId={FeatureId.CUSTOM_LOGIN_BANNER}
          />
        </div>

        {isDemo && (
          <div className="col-sm-12 mt-2">
            <span className="small text-muted">
              You cannot use this feature in the demo version of Portainer.
            </span>
          </div>
        )}
        <div className="col-sm-12 text-muted small mt-2">
          You can set a custom banner that will be shown to all users during
          login.
        </div>
      </div>

      {isEnabled && (
        <FormControl
          label="Details"
          inputId="custom_login_banner"
          errors={error}
          required
        >
          <Field
            as={TextArea}
            name={name}
            rows="5"
            id="custom_login_banner"
            placeholder="Banner details"
          />
        </FormControl>
      )}
    </>
  );
}

function TemplatesUrlSection() {
  const [{ name }, { error }] = useField<string>('templatesUrl');
  return (
    <FormSection title="App Templates">
      <div className="form-group">
        <span className="col-sm-12 text-muted small">
          You can specify the URL to your own template definitions file here.
          See
          <a
            href="https://docs.portainer.io/advanced/app-templates/build"
            target="_blank"
            rel="noreferrer"
          >
            Portainer documentation
          </a>{' '}
          for more details.
        </span>
      </div>

      <FormControl label="URL" inputId="templates_url" required errors={error}>
        <Field
          as={Input}
          id="templates_url"
          placeholder="https://myserver.mydomain/templates.json"
          required
          data-cy="settings-templateUrl"
          name={name}
        />
      </FormControl>
    </FormSection>
  );
}

function validation(): SchemaOf<Values> {
  return object({
    edgeAgentCheckinInterval: number().required(),
    enableTelemetry: bool().required(),
    loginBannerEnabled: boolean().default(false),
    loginBanner: string()
      .default('')
      .when('loginBannerEnabled', {
        is: true,
        then: string().required('Login banner is required when enabled'),
      }),
    logoEnabled: boolean().default(false),
    logo: string()
      .default('')
      .when('logoEnabled', {
        is: true,
        then: string()
          .required('Logo url is required when enabled')
          .test('valid-url', 'Must be a valid URL', (value) =>
            isValidUrl(value)
          ),
      }),
    snapshotInterval: string().required('Snapshot interval is required'),
    templatesUrl: string()
      .required('Templates URL is required')
      .test('valid-url', 'Must be a valid URL', (value) => isValidUrl(value)),
  });
}
