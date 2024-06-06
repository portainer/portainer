import clsx from 'clsx';

import { Button } from '@@/buttons';
import { InputGroup } from '@@/form-components/InputGroup';

export function OverridableInput({
  value,
  onChange,
  id,
  placeholder,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  id: string;
  placeholder: string;
}) {
  const override = value !== null;

  return (
    <InputGroup>
      <InputGroup.ButtonWrapper>
        <Button
          color="light"
          data-cy={`docker-container-default-${id}`}
          size="medium"
          className={clsx('!ml-0', { active: !override })}
          onClick={() => onChange(null)}
        >
          Default
        </Button>
        <Button
          color="light"
          data-cy={`docker-container-override-${id}`}
          size="medium"
          className={clsx({ active: override })}
          onClick={() => onChange('')}
        >
          Override
        </Button>
      </InputGroup.ButtonWrapper>
      <InputGroup.Input
        disabled={!override}
        data-cy={`docker-container-input-${id}`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        id={id}
        placeholder={placeholder}
      />
    </InputGroup>
  );
}
