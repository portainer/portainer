import { useFormik } from 'formik';
import { ChangeEvent, KeyboardEvent } from 'react';
import { object, number } from 'yup';

import { Button } from '@@/buttons';
import { Input } from '@@/form-components/Input';

interface Values {
  page: number | '';
}

interface Props {
  onChange(page: number): void;
  totalPages: number;
}

export function PageInput({ onChange, totalPages }: Props) {
  const { handleSubmit, setFieldValue, values, isValid } = useFormik<Values>({
    initialValues: { page: '' },
    onSubmit: async ({ page }) => page && onChange(page),
    validateOnMount: true,
    validationSchema: () =>
      object({ page: number().required().max(totalPages).min(1) }),
  });

  return (
    <form className="mx-3" onSubmit={handleSubmit}>
      <label className="m-0 mr-2 font-normal small" htmlFor="go-to-page-input">
        Go to page
      </label>
      <Input
        id="go-to-page-input"
        className="!w-32"
        type="number"
        value={values.page}
        max={totalPages}
        min={1}
        step={1}
        onChange={handleChange}
        onKeyPress={preventNotNumber}
      />
      <Button type="submit" disabled={!isValid}>
        Go
      </Button>
    </form>
  );

  function preventNotNumber(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key.match(/^\D$/)) {
      e.preventDefault();
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const value = parseInt(e.target.value, 10);
    setFieldValue('page', Number.isNaN(value) ? '' : value);
  }
}
