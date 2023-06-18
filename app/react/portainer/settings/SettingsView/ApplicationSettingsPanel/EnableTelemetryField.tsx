import { useField } from 'formik';

import { useIsDemo } from '@/react/portainer/system/useSystemStatus';

import { SwitchField } from '@@/form-components/SwitchField';

import { DemoAlert } from './DemoAlert';

export function EnableTelemetryField() {
  const isDemoQuery = useIsDemo();
  const [{ value }, , { setValue }] = useField<boolean>('enableTelemetry');

  return (
    <div className="form-group">
      <div className="col-sm-12">
        <SwitchField
          labelClass="col-sm-3 col-lg-2"
          label="Allow the collection of anonymous statistics"
          checked={value}
          name="toggle_enableTelemetry"
          onChange={(checked) => setValue(checked)}
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
  );
}
