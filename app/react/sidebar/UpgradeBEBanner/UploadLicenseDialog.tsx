import { Field, Form, Formik } from 'formik';
import { object, SchemaOf, string } from 'yup';
import { ExternalLink } from 'lucide-react';

import { useUpgradeEditionMutation } from '@/react/portainer/system/useUpgradeEditionMutation';
import { notifySuccess } from '@/portainer/services/notifications';

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

export function UploadLicenseDialog({
  onDismiss,
  goToLoading,
}: {
  onDismiss: () => void;
  goToLoading: () => void;
}) {
  const upgradeMutation = useUpgradeEditionMutation();

  return (
    <Modal
      onDismiss={onDismiss}
      aria-label="Upgrade Portainer to Business Edition"
    >
      <Modal.Header
        title={<h4 className="font-medium text-xl">Upgrade Portainer</h4>}
      />
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validationSchema={validation}
        validateOnMount
      >
        {({ errors }) => (
          <Form noValidate>
            <Modal.Body>
              <p className="font-semibold text-gray-7">
                Please enter your Portainer License below
              </p>
              <FormControl
                label="License"
                errors={errors.license}
                required
                size="vertical"
              >
                <Field name="license" as={Input} required />
              </FormControl>
            </Modal.Body>
            <Modal.Footer>
              <div className="flex gap-2 [&>*]:w-1/2 w-full">
                <a
                  href="https://www.portainer.io/pricing"
                  target="_blank"
                  rel="noreferrer"
                  className="no-link"
                >
                  <Button
                    color="default"
                    size="medium"
                    className="w-full"
                    icon={ExternalLink}
                  >
                    Get a license
                  </Button>
                </a>
                <LoadingButton
                  color="primary"
                  size="medium"
                  loadingText="Validating License"
                  isLoading={upgradeMutation.isLoading}
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
    upgradeMutation.mutate(values, {
      onSuccess() {
        notifySuccess('Starting upgrade', 'License validated successfully');
        goToLoading();
      },
    });
  }
}

function validation(): SchemaOf<FormValues> {
  return object().shape({
    license: string()
      .required('License is required')
      .matches(/^\d-.+/, 'License is invalid'),
  });
}
