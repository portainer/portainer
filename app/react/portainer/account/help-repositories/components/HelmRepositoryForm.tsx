import { Field, Form, Formik } from 'formik';
import { useRouter } from '@uirouter/react';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { LoadingButton } from '@@/buttons/LoadingButton';
import { Button } from '@@/buttons';

import { CreateHelmRepositoryPayload } from '../../AccountView/HelmRepositoryDatatable/types';

import { validationSchema } from './CreateHelmRepositoryForm.validation';

type Props = {
  isEditing?: boolean;
  isLoading: boolean;
  onSubmit: (formValues: CreateHelmRepositoryPayload) => void;
  URLs: string[];
  initialValues?: CreateHelmRepositoryPayload;
};

const defaultInitialValues = {
  URL: '',
  UserId: 0,
};

export function HelmRepositoryForm({
  isEditing = false,
  isLoading,
  onSubmit,
  URLs,
  initialValues = defaultInitialValues,
}: Props) {
  const router = useRouter();

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize
      validationSchema={() => validationSchema(URLs)}
      onSubmit={(values) => onSubmit(values)}
      validateOnMount
    >
      {({ values, errors, handleSubmit, isValid, dirty }) => (
        <Form className="form-horizontal" onSubmit={handleSubmit} noValidate>
          <FormControl inputId="url" label="URL" errors={errors.URL} required>
            <Field
              as={Input}
              name="URL"
              value={values.URL}
              autoComplete="off"
              id="URL"
            />
          </FormControl>
          <div className="form-group">
            <div className="col-sm-12 mt-3">
              <LoadingButton
                disabled={!isValid || !dirty}
                isLoading={isLoading}
                loadingText="Saving helm repository..."
              >
                {isEditing ? 'Update helm repository' : 'Save helm repository'}
              </LoadingButton>
              {isEditing && (
                <Button
                  color="default"
                  onClick={() => router.stateService.go('portainer.account')}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
}
