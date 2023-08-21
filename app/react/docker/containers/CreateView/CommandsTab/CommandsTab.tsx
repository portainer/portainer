import { FormikErrors } from 'formik';
import { useState } from 'react';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

import { ConsoleSettings } from './ConsoleSettings';
import { LoggerConfig } from './LoggerConfig';
import { OverridableInput } from './OverridableInput';
import { Values } from './types';

export function CommandsTab({
  apiVersion,
  values,
  onChange,
  errors,
}: {
  apiVersion: number;
  values: Values;
  onChange: (values: Values) => void;
  errors?: FormikErrors<Values>;
}) {
  const [controlledValues, setControlledValues] = useState(values);

  return (
    <div className="mt-3">
      <FormControl
        label="Command"
        inputId="command-input"
        size="xsmall"
        errors={errors?.cmd}
      >
        <OverridableInput
          value={controlledValues.cmd}
          onChange={(cmd) => handleChange({ cmd })}
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
          value={controlledValues.entrypoint}
          onChange={(entrypoint) => handleChange({ entrypoint })}
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
            value={controlledValues.workingDir}
            onChange={(e) => handleChange({ workingDir: e.target.value })}
            placeholder="e.g. /myapp"
          />
        </FormControl>
        <FormControl
          label="User"
          inputId="user-input"
          className="w-1/2"
          errors={errors?.user}
        >
          <Input
            value={controlledValues.user}
            onChange={(e) => handleChange({ user: e.target.value })}
            placeholder="e.g. nginx"
          />
        </FormControl>
      </div>

      <ConsoleSettings
        value={controlledValues.console}
        onChange={(console) => handleChange({ console })}
      />

      <LoggerConfig
        apiVersion={apiVersion}
        value={controlledValues.logConfig}
        onChange={(logConfig) =>
          handleChange({
            logConfig,
          })
        }
        errors={errors?.logConfig}
      />
    </div>
  );

  function handleChange(newValues: Partial<Values>) {
    onChange({ ...values, ...newValues });
    setControlledValues((values) => ({ ...values, ...newValues }));
  }
}
