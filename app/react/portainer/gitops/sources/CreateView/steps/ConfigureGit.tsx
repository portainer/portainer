import { useFormikContext } from 'formik';

import { Input } from '@@/form-components/Input';
import { FormControl } from '@@/form-components/FormControl';
import { SwitchField } from '@@/form-components/SwitchField';

import { IntervalField } from '../../components/IntervalField';
import { FormValues } from '../type';

import { Authentication } from './Authentication';
import { ConnectionTest } from './ConnectionTest';

export function ConfigureGit() {
  const { values, setFieldValue, errors } = useFormikContext<FormValues>();

  if (values.type !== 'git') {
    return null;
  }

  return (
    <div className="grid">
      <FormControl
        inputId="repository-url-input"
        label="Repository URL"
        required
        errors={errors.git?.url}
        tooltip="Enter the full URL of your git repository"
      >
        <Input
          id="repository-url-input"
          value={values.git.url}
          data-cy="repository-url-input"
          placeholder="https://github.com/org/repo"
          required
          onChange={({ target: { value } }) => setFieldValue('git.url', value)}
        />
      </FormControl>

      <SwitchField
        label="Skip TLS Verification"
        labelClass="col-sm-3 col-lg-2"
        name="TLSSkipVerify"
        checked={values.git.tlsSkipVerify || false}
        onChange={(value) => setFieldValue('git.tlsSkipVerify', value)}
        tooltip="Enabling this will allow skipping TLS validation for any self-signed certificate."
        data-cy="tls-skip-verify"
      />

      <Authentication />

      <SwitchField
        label="Enable polling"
        labelClass="col-sm-3 col-lg-2"
        name="polling-enabled"
        checked={values.git.polling.enabled}
        onChange={(value) => setFieldValue('git.polling.enabled', value)}
        tooltip="When enabled, Portainer periodically fetches this repository to detect changes."
        data-cy="source-polling-switch"
      />

      {values.git.polling.enabled && (
        <div className="mb-0 mt-4">
          <IntervalField
            value={values.git.polling.interval}
            onChange={(value) => setFieldValue('git.polling.interval', value)}
            errors={errors.git?.polling?.interval}
          />
        </div>
      )}

      <ConnectionTest />
    </div>
  );
}
