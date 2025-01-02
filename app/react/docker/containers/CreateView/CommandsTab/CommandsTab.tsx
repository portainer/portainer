import { FormikErrors } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

import { ConsoleSettings } from './ConsoleSettings';
import { LoggerConfig } from './LoggerConfig';
import { OverridableInput } from './OverridableInput';
import { Values } from './types';

export function CommandsTab({
  apiVersion,
  values,
  setFieldValue,
  errors,
}: {
  apiVersion: number;
  values: Values;
  setFieldValue: (field: string, value: unknown) => void;
  errors?: FormikErrors<Values>;
}) {
  return (
    <div className="mt-3">
      <FormControl
        label="Command"
        inputId="command-input"
        size="xsmall"
        errors={errors?.cmd}
      >
        <OverridableInput
          value={values.cmd}
          onChange={(cmd) => setFieldValue('cmd', cmd)}
          id="command-input"
          placeholder="e.g. '-logtostderr' '--housekeeping_interval=5s' or /usr/bin/nginx -t -c /mynginx.conf"
        />
      </FormControl>

      <FormControl
        label="Entrypoint"
        inputId="entrypoint-input"
        size="xsmall"
        tooltip="When container entrypoint is entered as part of the Command field, set Entrypoint to Override mode and leave blank, else it will revert to default."
        errors={errors?.entrypoint}
      >
        <OverridableInput
          value={values.entrypoint}
          onChange={(entrypoint) => setFieldValue('entrypoint', entrypoint)}
          id="entrypoint-input"
          placeholder="e.g. /bin/sh -c"
        />
      </FormControl>

      <div className="flex justify-between gap-4">
        <FormControl
          label="Working Dir"
          inputId="working-dir-input"
          className="w-1/2"
          errors={errors?.workingDir}
        >
          <Input
            value={values.workingDir}
            onChange={(e) => setFieldValue('workingDir', e.target.value)}
            placeholder="e.g. /myapp"
            data-cy="working-dir-input"
          />
        </FormControl>
        <FormControl
          label="User"
          inputId="user-input"
          className="w-1/2"
          errors={errors?.user}
        >
          <Input
            value={values.user}
            onChange={(e) => setFieldValue('user', e.target.value)}
            placeholder="e.g. nginx"
            data-cy="user-input"
          />
        </FormControl>
      </div>

      <ConsoleSettings
        value={values.console}
        onChange={(console) => setFieldValue('console', console)}
      />

      <LoggerConfig
        apiVersion={apiVersion}
        value={values.logConfig}
        onChange={(logConfig) => setFieldValue('logConfig', logConfig)}
        errors={errors?.logConfig}
      />
    </div>
  );
}
