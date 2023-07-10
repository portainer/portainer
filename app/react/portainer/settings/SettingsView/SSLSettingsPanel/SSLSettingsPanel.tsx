import { Form, Formik } from 'formik';
import { Key } from 'lucide-react';
import { useState } from 'react';
import { SchemaOf, bool, object } from 'yup';

import { withHideOnExtension } from '@/react/hooks/withHideOnExtension';

import { Widget } from '@@/Widget';
import { LoadingButton } from '@@/buttons';
import {
  file,
  withFileExtension,
} from '@@/form-components/yup-file-validation';
import { TextTip } from '@@/Tip/TextTip';
import { FormControl } from '@@/form-components/FormControl';
import { FileUploadField } from '@@/form-components/FileUpload';
import { SwitchField } from '@@/form-components/SwitchField';

import { useUpdateSSLConfigMutation } from '../useUpdateSSLConfigMutation';
import { useSSLSettings } from '../../queries/useSSLSettings';

interface FormValues {
  certFile: File | null;
  keyFile: File | null;
  forceHTTPS: boolean;
}

export const SSLSettingsPanelWrapper = withHideOnExtension(SSLSettingsPanel);

function SSLSettingsPanel() {
  const settingsQuery = useSSLSettings();
  const [reloadingPage, setReloadingPage] = useState(false);
  const mutation = useUpdateSSLConfigMutation();

  if (!settingsQuery.data) {
    return null;
  }

  const initialValues: FormValues = {
    certFile: null,
    keyFile: null,
    forceHTTPS: !settingsQuery.data.httpEnabled,
  };

  return (
    <Widget>
      <Widget.Title icon={Key} title="SSL certificate" />
      <Widget.Body>
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          validationSchema={validation}
          validateOnMount
        >
          {({ values, setFieldValue, isValid, errors }) => (
            <Form className="form-horizontal">
              <div className="form-group">
                <div className="col-sm-12">
                  <TextTip color="orange">
                    Forcing HTTPs only will cause Portainer to stop listening on
                    the HTTP port. Any edge agent environment that is using HTTP
                    will no longer be available.
                  </TextTip>
                </div>
              </div>

              <div className="form-group">
                <div className="col-sm-12">
                  <SwitchField
                    checked={values.forceHTTPS}
                    label="Force HTTPS only"
                    labelClass="col-sm-3 col-lg-2"
                    name="forceHTTPS"
                    onChange={(value) => setFieldValue('forceHTTPS', value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="col-sm-12">
                  <TextTip color="blue">
                    Provide a new SSL Certificate to replace the existing one
                    that is used for HTTPS connections.
                  </TextTip>
                </div>
              </div>

              <FormControl
                label="SSL/TLS certificate"
                tooltip="Select an X.509 certificate file, commonly a crt, cer or pem file."
                inputId="ca-cert-field"
                errors={errors.certFile}
              >
                <FileUploadField
                  required={typeof errors.certFile !== 'undefined'}
                  inputId="ca-cert-field"
                  name="certFile"
                  onChange={(file) => setFieldValue('certFile', file)}
                  value={values.certFile}
                />
              </FormControl>

              <FormControl
                label="SSL/TLS private key"
                tooltip="Select a private key file, commonly a key, or pem file."
                inputId="ca-cert-field"
                errors={errors.keyFile}
              >
                <FileUploadField
                  required={typeof errors.keyFile !== 'undefined'}
                  inputId="ca-cert-field"
                  name="keyFile"
                  onChange={(file) => setFieldValue('keyFile', file)}
                  value={values.keyFile}
                />
              </FormControl>

              <div className="form-group">
                <div className="col-sm-12">
                  <LoadingButton
                    isLoading={mutation.isLoading || reloadingPage}
                    disabled={!isValid}
                    loadingText={reloadingPage ? 'Reloading' : 'Saving'}
                    className="!ml-0"
                  >
                    Save SSL Settings
                  </LoadingButton>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </Widget.Body>
    </Widget>
  );

  function handleSubmit({ certFile, forceHTTPS, keyFile }: FormValues) {
    if (!certFile || !keyFile) {
      return;
    }

    mutation.mutate(
      { certFile, httpEnabled: !forceHTTPS, keyFile },
      {
        async onSuccess() {
          await new Promise((resolve) => {
            setTimeout(resolve, 5000);
          });
          window.location.reload();
          setReloadingPage(true);
        },
      }
    );
  }
}

function validation(): SchemaOf<FormValues> {
  return object({
    certFile: withFileExtension(file(), ['pem', 'crt', 'cer', 'cert']).required(
      ''
    ),
    keyFile: withFileExtension(file(), ['pem', 'key']).required(''),
    forceHTTPS: bool().required(),
  });
}
