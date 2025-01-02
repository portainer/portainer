import { Field, Form, Formik } from 'formik';
import { useRouter } from '@uirouter/react';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { LoadingButton } from '@@/buttons/LoadingButton';
import { Button } from '@@/buttons';

import { HelmRepositoryFormValues } from '../../AccountView/HelmRepositoryDatatable/types';

import { validationSchema } from './CreateHelmRepositoryForm.validation';

type Props = {
  isEditing?: boolean;
  isLoading: boolean;
  onSubmit: (formValues: HelmRepositoryFormValues) => void;
  URLs: string[];
};

const defaultInitialValues: HelmRepositoryFormValues = {
  URL: '',
};

export function HelmRepositoryForm({
  isEditing = false,
  isLoading,
  onSubmit,
  URLs,
}: Props) {
  const router = useRouter();

  return (
    <Formik<HelmRepositoryFormValues>
      initialValues={defaultInitialValues}
      enableReinitialize
      validationSchema={() => validationSchema(URLs)}
      onSubmit={(values) => onSubmit(values)}
      validateOnMount
    >
      {({ values, errors, handleSubmit, isValid, dirty }) => (
        <Form className="form-horizontal" onSubmit={handleSubmit} noValidate>
          <FormControl
            inputId="url-field"
            label="URL"
            errors={errors.URL}
            required
          >
            <Field
              as={Input}
              name="URL"
              value={values.URL}
              autoComplete="off"
              id="url-field"
            />
          </FormControl>
          <div className="form-group">
            <div className="col-sm-12 mt-3">
              <LoadingButton
                disabled={!isValid || !dirty}
                data-cy="helm-repository-save-button"
                isLoading={isLoading}
                loadingText="Saving Helm repository..."
              >
                {isEditing ? 'Update Helm repository' : 'Save Helm repository'}
              </LoadingButton>
              {isEditing && (
                <Button
                  color="default"
                  data-cy="helm-repository-cancel-button"
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
