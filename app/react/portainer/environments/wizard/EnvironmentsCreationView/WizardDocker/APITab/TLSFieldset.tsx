import { useFormikContext } from 'formik';

import {
  file,
  withFileSize,
  withFileType,
} from '@/portainer/helpers/yup-file-validation';

import { FileUploadField } from '@@/form-components/FileUpload';
import { SwitchField } from '@@/form-components/SwitchField';
import { FormControl } from '@@/form-components/FormControl';

import { FormValues } from './types';

export function TLSFieldset() {
  const { values, setFieldValue, errors } = useFormikContext<FormValues>();

  return (
    <>
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            label="TLS"
            checked={values.tls}
            onChange={(checked) => setFieldValue('tls', checked)}
          />
        </div>
      </div>

      {values.tls && (
        <>
          <div className="form-group">
            <div className="col-sm-12">
              <SwitchField
                label="Skip Certification Verification"
                checked={!!values.skipVerify}
                onChange={(checked) => setFieldValue('skipVerify', checked)}
              />
            </div>
          </div>

          {!values.skipVerify && (
            <>
              <FormControl
                label="TLS CA certificate"
                inputId="ca-cert-field"
                errors={errors.caCertFile}
              >
                <FileUploadField
                  inputId="ca-cert-field"
                  onChange={(file) => setFieldValue('caCertFile', file)}
                  value={values.caCertFile}
                />
              </FormControl>
              <FormControl
                label="TLS certificate"
                inputId="cert-field"
                errors={errors.certFile}
              >
                <FileUploadField
                  inputId="cert-field"
                  onChange={(file) => setFieldValue('certFile', file)}
                  value={values.certFile}
                />
              </FormControl>
              <FormControl
                label="TLS key"
                inputId="tls-key-field"
                errors={errors.keyFile}
              >
                <FileUploadField
                  inputId="tls-key-field"
                  onChange={(file) => setFieldValue('keyFile', file)}
                  value={values.keyFile}
                />
              </FormControl>
            </>
          )}
        </>
      )}
    </>
  );
}

const MAX_FILE_SIZE = 5_242_880; // 5MB
const ALLOWED_FILE_TYPES = [
  'application/x-x509-ca-cert',
  'application/x-pem-file',
];

function certValidation() {
  return withFileType(
    withFileSize(file(), MAX_FILE_SIZE),
    ALLOWED_FILE_TYPES
  ).when(['tls', 'skipVerify'], {
    is: (tls: boolean, skipVerify: boolean) => tls && !skipVerify,
    then: (schema) => schema.required('File is required'),
  });
}

export function validation() {
  return {
    caCertFile: certValidation(),
    certFile: certValidation(),
    keyFile: certValidation(),
  };
}
