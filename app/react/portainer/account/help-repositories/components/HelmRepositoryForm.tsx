import { Field, Form, Formik } from 'formik';
import { useRouter } from '@uirouter/react';

import { useCurrentUser } from '@/react/hooks/useUser';

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
}: Props) {
  const router = useRouter();

  const { user } = useCurrentUser();
  defaultInitialValues.UserId = user.Id;

  return (
    <Formik
      initialValues={defaultInitialValues}
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
                loadingText="Saving Helm repository..."
              >
                {isEditing ? 'Update Helm repository' : 'Save Helm repository'}
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
