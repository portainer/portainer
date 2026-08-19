import { Field, Form, Formik } from 'formik';
import { object, SchemaOf, string } from 'yup';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useResizePVC } from '@/react/kubernetes/volumes/queries/useResizePVC';

import { Modal } from '@@/modals';
import { LoadingButton } from '@@/buttons';
import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

import { PersistentVolumeClaim } from './types';

interface ResizeClaimEditFormValues {
  newSize: string;
}

interface Props {
  claim: PersistentVolumeClaim;
  onDismiss: () => void;
}

export function ResizeClaimEditForm({ claim, onDismiss }: Props) {
  const envId = useEnvironmentId();
  const resizeMutation = useResizePVC(envId);

  const initialValues: ResizeClaimEditFormValues = {
    newSize: claim.storageRequest ?? '',
  };

  return (
    <>
      <Modal.Header title="Resize Persistent Volume Claim" />

      <Formik<ResizeClaimEditFormValues>
        initialValues={initialValues}
        validationSchema={validationSchema()}
        onSubmit={onSubmit}
        validateOnChange
      >
        {({ errors, handleSubmit, isSubmitting }) => (
          <>
            <Modal.Body>
              <Form className="form-vertical" onSubmit={handleSubmit}>
                <FormControl
                  label="New size"
                  inputId="newSize-input"
                  errors={errors.newSize}
                  size="vertical"
                >
                  <Field
                    as={Input}
                    id="newSize-input"
                    name="newSize"
                    placeholder="e.g. 10Gi"
                    data-cy="kubernetes-pvc-resize-size-input"
                  />
                </FormControl>
              </Form>
            </Modal.Body>

            <Modal.Footer>
              <LoadingButton
                loadingText="Resizing..."
                isLoading={isSubmitting}
                onClick={() => handleSubmit()}
                data-cy="kubernetes-pvc-resize-submit"
              >
                Resize
              </LoadingButton>
            </Modal.Footer>
          </>
        )}
      </Formik>
    </>
  );

  async function onSubmit(values: ResizeClaimEditFormValues) {
    await resizeMutation.mutateAsync({
      namespace: claim.namespace,
      name: claim.name,
      newSize: values.newSize,
    });
    onDismiss();
  }
}

function validationSchema(): SchemaOf<ResizeClaimEditFormValues> {
  return object().shape({
    newSize: string().required('New size is required'),
  });
}
