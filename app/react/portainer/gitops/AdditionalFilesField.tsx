import { FormikErrors } from 'formik';

import { FormError } from '@@/form-components/FormError';
import { InputGroup } from '@@/form-components/InputGroup';
import { InputList, ItemProps } from '@@/form-components/InputList';
import { useCaretPosition } from '@@/form-components/useCaretPosition';

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
  const { ref, updateCaret } = useCaretPosition();

  return (
    <>
      <InputGroup size="small" className="col-sm-5">
        <InputGroup.Addon>path</InputGroup.Addon>
        <InputGroup.Input
          mRef={ref}
          required
          disabled={disabled}
          readOnly={readOnly}
          value={item}
          onChange={(e) => {
            onChange(e.target.value);
            updateCaret();
          }}
        />
      </InputGroup>
      {error && <FormError>{error}</FormError>}
    </>
  );
}
