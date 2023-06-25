import { Formik, Form, Field } from 'formik';
import { Plus } from 'lucide-react';
import { SchemaOf, object, string } from 'yup';
import { useReducer } from 'react';

import { Button } from '@@/buttons';
import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

export function AddLabelForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (name: string, value: string) => void;
  isLoading: boolean;
}) {
  const [formKey, clearForm] = useReducer((state) => state + 1, 0);

  const initialValues = {
    name: '',
    value: '',
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validation}
      key={formKey}
    >
      {({ errors, isValid, dirty }) => (
        <Form className="form-horizontal">
          <div className="flex w-full items-start gap-4">
            <FormControl label="Name" errors={errors.name} className="flex-1">
              <Field
                as={Input}
                name="name"
                placeholder="e.g. com.example.foo"
              />
            </FormControl>

            <FormControl label="Value" errors={errors.value} className="flex-1">
              <Field as={Input} name="value" placeholder="e.g. bar" />
            </FormControl>

            <Button
              type="submit"
              icon={Plus}
              disabled={!dirty || !isValid || isLoading}
            >
              Add filter
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );

  function handleSubmit(values: typeof initialValues) {
    clearForm();
    onSubmit(values.name, values.value);
  }
}

function validation(): SchemaOf<{ name: string; value: string }> {
  return object({
    name: string().required('Name is required'),
    value: string().default(''),
  });
}
