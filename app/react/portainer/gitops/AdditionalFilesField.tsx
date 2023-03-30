import { FormikErrors } from 'formik';

import { useStateWrapper } from '@/react/hooks/useStateWrapper';

import { FormError } from '@@/form-components/FormError';
import { InputGroup } from '@@/form-components/InputGroup';
import { InputList, ItemProps } from '@@/form-components/InputList';

interface Props {
  value: Array<string>;
  onChange: (value: Array<string>) => void;
  errors?: FormikErrors<string>[] | string | string[];
}

export function AdditionalFileField({ onChange, value, errors }: Props) {
  return (
    <InputList
      errors={errors}
      label="Additional paths"
      onChange={onChange}
      value={value}
      addLabel="Add file"
      item={Item}
      itemBuilder={() => ''}
    />
  );
}

function Item({
  item,
  onChange,
  disabled,
  error,
  readOnly,
}: ItemProps<string>) {
  const [inputValue, updateInputValue] = useStateWrapper(item, onChange);

  return (
    <div className="relative flex flex-col">
      <InputGroup size="small">
        <InputGroup.Addon>path</InputGroup.Addon>
        <InputGroup.Input
          required
          disabled={disabled}
          readOnly={readOnly}
          value={inputValue}
          onChange={(e) => {
            updateInputValue(e.target.value);
          }}
        />
      </InputGroup>
      {error && (
        <div className="absolute -bottom-7">
          <FormError>{error}</FormError>
        </div>
      )}
    </div>
  );
}
