import { Field, Form, Formik } from 'formik';
import { object, SchemaOf, string } from 'yup';

import { Button, LoadingButton } from '@@/buttons';
import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { Modal } from '@@/modals/Modal';

interface FormValues {
  license: string;
}

const initialValues: FormValues = {
  license: '',
};

export function LicenseDialog({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Modal
      onDismiss={onDismiss}
      aria-label="Upgrade Portainer to Business Edition"
    >
      <Modal.Header title="Upgrade Portainer" />
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validationSchema={validation}
      >
        {({ errors }) => (
          <Form className="form-horizontal" noValidate>
            <Modal.Body>
              <p>Please enter your Portainer License Below</p>
              <FormControl label="License" errors={errors.license} required>
                <Field name="license" as={Input} required />
              </FormControl>
            </Modal.Body>
            <Modal.Footer>
              <div className="flex gap-2 [&>*]:w-1/2 w-full">
                <a
                  href="https://www.portainer.io/take-5"
                  target="_blank"
                  rel="noreferrer"
                  className="no-link"
                >
                  <Button color="default" size="medium" className="w-full">
                    Get a license
                  </Button>
                </a>
                <LoadingButton
                  color="primary"
                  size="medium"
                  loadingText="Validating License"
                  isLoading={false}
                >
                  Start upgrade
                </LoadingButton>
              </div>
            </Modal.Footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );

  function handleSubmit(values: FormValues) {
    console.log(values);
  }
}

function validation(): SchemaOf<FormValues> {
  return object().shape({
    license: string().required('License is required'),
  });
}

/**
 * 
 todo:

 - validate license
 - send it to server:
  - server will validate it
  - if valid:
    - start "upgrade" process
    - return ok
  - if invalid:
    - return error
  - go to "loading" screen
  
 * 
 */
