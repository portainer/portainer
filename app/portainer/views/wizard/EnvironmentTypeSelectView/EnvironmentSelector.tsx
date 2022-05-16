import { FormSection } from '@/portainer/components/form-components/FormSection';
import { r2a } from '@/react-tools/react2angular';

import { EnvironmentSelectorItem } from './EnvironmentSelectorItem';
import { environmentTypes } from './environment-types';

export type Value = typeof environmentTypes[number]['id'];

interface Props {
  value: Value[];
  onChange(value: Value[]): void;
}

export function EnvironmentSelector({ value, onChange }: Props) {
  return (
    <div className="row">
      <FormSection title="Select your environment(s)">
        <p className="text-muted small">
          You can onboard different types of environments, select all that
          apply.
        </p>
        <div className="col-sm-12">
          {environmentTypes.map((eType) => (
            <EnvironmentSelectorItem
              key={eType.id}
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

  function handleClick(eType: Value) {
    if (value.includes(eType)) {
      onChange(value.filter((v) => v !== eType));
      return;
    }

    onChange([...value, eType]);
  }
}

export const EnvironmentSelectorAngular = r2a(EnvironmentSelector, [
  'value',
  'onChange',
]);
