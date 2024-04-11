import { bool, object, SchemaOf, string } from 'yup';

import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';
import { SwitchField } from '@@/form-components/SwitchField';

import { RuntimeSelector } from './RuntimeSelector';

export interface Values {
  privileged: boolean;
  init: boolean;
  type: string;
}

export function RuntimeSection({
  values,
  onChange,
  allowPrivilegedMode,
  isInitFieldVisible,
}: {
  values: Values;
  onChange: (values: Values) => void;
  allowPrivilegedMode: boolean;
  isInitFieldVisible: boolean;
}) {
  return (
    <FormSection title="Runtime">
      {allowPrivilegedMode && (
        <div className="form-group">
          <div className="col-sm-12">
            <SwitchField
              labelClass="col-sm-2"
              data-cy="docker-privileged-switch"
              label="Privileged mode"
              checked={values.privileged}
              onChange={(privileged) => handleChange({ privileged })}
            />
          </div>
        </div>
      )}

      {isInitFieldVisible && (
        <div className="form-group">
          <div className="col-sm-12">
            <SwitchField
              labelClass="col-sm-2"
              data-cy="docker-init-switch"
              label="Init"
              checked={values.init}
              onChange={(init) => handleChange({ init })}
            />
          </div>
        </div>
      )}

      <FormControl label="Type" inputId="container_runtime" size="xsmall">
        <RuntimeSelector
          value={values.type}
          onChange={(type) => handleChange({ type })}
        />
      </FormControl>
    </FormSection>
  );

  function handleChange(newValues: Partial<Values>) {
    onChange({ ...values, ...newValues });
  }
}

export function runtimeValidation(): SchemaOf<Values> {
  return object({
    privileged: bool().default(false),
    init: bool().default(false),
    type: string().default(''),
  });
}
