import { FormSection } from '@@/form-components/FormSection';
import { SwitchField } from '@@/form-components/SwitchField';

import { capabilities } from './types';

export type Values = string[];

export function CapabilitiesTab({
  values,
  onChange,
}: {
  values: Values;
  onChange: (values: Values) => void;
}) {
  return (
    <FormSection title="Container capabilities">
      <div className="form-group flex flex-wrap gap-y-2 px-5">
        {capabilities.map((cap) => (
          <div key={cap.key} className="w-1/3 text-center">
            <SwitchField
              labelClass="col-sm-6"
              data-cy="docker-container-capability-switch"
              tooltip={cap.description}
              checked={values.includes(cap.key)}
              label={cap.key}
              name={`${cap.key}-capability`}
              onChange={(value) => {
                if (value) {
                  onChange([...values, cap.key]);
                } else {
                  onChange(values.filter((v) => v !== cap.key));
                }
              }}
            />
          </div>
        ))}
      </div>
    </FormSection>
  );
}
