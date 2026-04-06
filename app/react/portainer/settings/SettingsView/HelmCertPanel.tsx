import { Form, Formik, useFormikContext } from 'formik';
import { Key } from 'lucide-react';
import { SchemaOf, object } from 'yup';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const mutation = useUpdateSSLConfigMutation();
  const initialValues = {
    clientCertFile: null,
  };

  return (
    <BEOverlay featureId={FeatureId.CA_FILE} variant="widget">
      <Widget>
        <Widget.Title
          icon={Key}
          title={t('settings.helm.title')}
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
          notifySuccess('Success', t('settings.helm.updated'));
        },
      }
    );
  }
}

function InnerForm({ isLoading }: { isLoading: boolean }) {
  const { t } = useTranslation();
  const { values, setFieldValue, errors, isValid } =
    useFormikContext<FormValues>();

  return (
    <Form className="form-horizontal">
      <div className="form-group">
        <div className="col-sm-12">
          <TextTip color="blue">
            {t('settings.helm.description')}
          </TextTip>
        </div>
      </div>

      <FormControl
        label={t('settings.helm_ca_file')}
        tooltip={t('settings.helm_ca_tooltip')}
        inputId="ca-cert-field"
        errors={errors?.clientCertFile}
      >
        <FileUploadField
          required
          data-cy="helm-cert-panel-file-upload-field"
          inputId="ca-cert-field"
          name="clientCertFile"
          onChange={(file) => setFieldValue('clientCertFile', file)}
          value={values.clientCertFile}
        />
      </FormControl>

      <FormActions
        isValid={isValid}
        isLoading={isLoading}
        submitLabel={t('settings.helm_apply')}
        loadingText={t('settings.helm_saving')}
        data-cy="helm-cert-panel-submit-button"
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
