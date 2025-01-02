import { FormError } from '../FormError';
import { InputLabeled } from '../Input/InputLabeled';
import { ItemProps } from '../InputList';

import { EnvVar } from './types';

export function EnvironmentVariableItem({
  item,
  onChange,
  disabled,
  error,
  readOnly,
  index,
}: ItemProps<EnvVar>) {
  return (
    <div className="relative flex w-full flex-col">
      <div className="flex w-full items-start gap-2">
        <div className="w-1/2">
          <InputLabeled
            className="w-full"
            data-cy={`env-name_${index}`}
            label="name"
            required
            value={item.name}
            onChange={(e) => handleChange({ name: e.target.value })}
            disabled={disabled}
            needsDeletion={item.needsDeletion}
            readOnly={readOnly}
            placeholder="e.g. FOO"
            size="small"
            id={`env-name${index}`}
          />
          {error && (
            <div>
              <FormError className="!mb-0 mt-1">
                {Object.values(error)[0]}
              </FormError>
            </div>
          )}
        </div>
        <InputLabeled
          className="w-1/2"
          data-cy={`env-value_${index}`}
          label="value"
          value={item.value}
          onChange={(e) => handleChange({ value: e.target.value })}
          disabled={disabled}
          needsDeletion={item.needsDeletion}
          readOnly={readOnly}
          placeholder="e.g. bar"
          size="small"
          id={`env-value${index}`}
        />
      </div>
    </div>
  );

  function handleChange(partial: Partial<EnvVar>) {
    onChange({ ...item, ...partial });
  }
}
