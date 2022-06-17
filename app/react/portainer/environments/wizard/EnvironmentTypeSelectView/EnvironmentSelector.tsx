import { FormSection } from '@@/form-components/FormSection';

import { Option } from '../components/Option';

import { environmentTypes } from './environment-types';

export type EnvironmentSelectorValue = typeof environmentTypes[number]['id'];

interface Props {
  value: EnvironmentSelectorValue[];
  onChange(value: EnvironmentSelectorValue[]): void;
}

export function EnvironmentSelector({ value, onChange }: Props) {
  return (
    <div className="row">
      <FormSection title="Select your environment(s)">
        <p className="text-muted small">
          You can onboard different types of environments, select all that
          apply.
        </p>
        <div className="flex gap-4 flex-wrap">
          {environmentTypes.map((eType) => (
            <Option
              key={eType.id}
              featureId={eType.featureId}
              title={eType.title}
              description={eType.description}
              icon={eType.icon}
              active={value.includes(eType.id)}
              onClick={() => handleClick(eType.id)}
            />
          ))}
        </div>
      </FormSection>
    </div>
  );

  function handleClick(eType: EnvironmentSelectorValue) {
    if (value.includes(eType)) {
      onChange(value.filter((v) => v !== eType));
      return;
    }

    onChange([...value, eType]);
  }
}
