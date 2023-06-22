import { Formik, Form, Field } from 'formik';
import { Plus } from 'lucide-react';
import { SchemaOf, object, string } from 'yup';

import { notifySuccess } from '@/portainer/services/notifications';

import { LoadingButton } from '@@/buttons';
import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

import { useUpdateSettingsMutation } from '../../queries';
import { Pair } from '../../types';

export function AddLabelForm({ existingLabels }: { existingLabels: Pair[] }) {
  const mutation = useUpdateSettingsMutation();

  const initialValues = {
    name: '',
    value: '',
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validation}
    >
      {({ errors, isValid }) => (
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

            <LoadingButton
              icon={Plus}
              loadingText="Adding"
              isLoading={mutation.isLoading}
              disabled={!isValid}
            >
              Add filter
            </LoadingButton>
          </div>
        </Form>
      )}
    </Formik>
  );

  function handleSubmit(values: typeof initialValues) {
    mutation.mutate(
      {
        BlackListedLabels: [
          ...existingLabels,
          { name: values.name, value: values.value },
        ],
      },
      {
        onSuccess: () => {
          notifySuccess('Success', 'Hidden container settings updated');
        },
      }
    );
  }
}

function validation(): SchemaOf<{ name: string; value: string }> {
  return object({
    name: string().required('Name is required'),
    value: string().default(''),
  });
}
