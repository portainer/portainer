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
          size="medium"
          className={clsx('!ml-0', { active: !override })}
          onClick={() => onChange(null)}
        >
          Default
        </Button>
        <Button
          color="light"
          size="medium"
          className={clsx({ active: override })}
          onClick={() => onChange('')}
        >
          Override
        </Button>
      </InputGroup.ButtonWrapper>
      <InputGroup.Input
        disabled={!override}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        id={id}
        placeholder={placeholder}
      />
    </InputGroup>
  );
}
