import { Form, Formik, useFormikContext } from 'formik';
import { Key } from 'lucide-react';
import { SchemaOf, object } from 'yup';

import { notifySuccess } from '@/portainer/services/notifications';

import { Widget } from '@@/Widget';
import { TextTip } from '@@/Tip/TextTip';
import { FileUploadField } from '@@/form-components/FileUpload';
import { FormControl } from '@@/form-components/FormControl';
import {
  file,
  withFileExtension,
} from '@@/form-components/yup-file-validation';
import { FormActions } from '@@/form-components/FormActions';
import { BEOverlay } from '@@/BEFeatureIndicator/BEOverlay';

import { FeatureId } from '../../feature-flags/enums';

import { useUpdateSSLConfigMutation } from './useUpdateSSLConfigMutation';

interface FormValues {
  clientCertFile: File | null;
}

export function HelmCertPanel() {
  const mutation = useUpdateSSLConfigMutation();
  const initialValues = {
    clientCertFile: null,
  };

  return (
    <BEOverlay featureId={FeatureId.CA_FILE} className="!p-0">
      <Widget>
        <Widget.Title
          icon={Key}
          title="Certificate Authority file for Kubernetes Helm repositories"
        />
        <Widget.Body>
          <Formik
            initialValues={initialValues}
            validationSchema={validation}
            onSubmit={handleSubmit}
            validateOnMount
          >
            <InnerForm isLoading={mutation.isLoading} />
          </Formik>
        </Widget.Body>
      </Widget>
    </BEOverlay>
  );

  function handleSubmit({ clientCertFile }: FormValues) {
    if (!clientCertFile) {
      return;
    }

    mutation.mutate(
      { clientCertFile },
      {
        onSuccess() {
          notifySuccess('Success', 'Helm certificate updated');
        },
      }
    );
  }
}

function InnerForm({ isLoading }: { isLoading: boolean }) {
  const { values, setFieldValue, errors, isValid } =
    useFormikContext<FormValues>();

  return (
    <Form className="form-horizontal">
      <div className="form-group">
        <div className="col-sm-12">
          <TextTip color="blue">
            Provide an additional CA file containing certificate(s) for HTTPS
            connections to Helm repositories.
          </TextTip>
        </div>
      </div>

      <FormControl
        label="CA file"
        tooltip="Select a CA file containing your X.509 certificate(s), commonly a crt, cer or pem file."
        inputId="ca-cert-field"
        errors={errors?.clientCertFile}
      >
        <FileUploadField
          required
          inputId="ca-cert-field"
          name="clientCertFile"
          onChange={(file) => setFieldValue('clientCertFile', file)}
          value={values.clientCertFile}
        />
      </FormControl>

      <FormActions
        isValid={isValid}
        isLoading={isLoading}
        submitLabel="Apply changes"
        loadingText="Saving in progress..."
      />
    </Form>
  );
}

function validation(): SchemaOf<FormValues> {
  return object({
    clientCertFile: withFileExtension(file(), [
      'pem',
      'crt',
      'cer',
      'cert',
    ]).required(''),
  });
}
