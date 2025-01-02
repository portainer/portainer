import { FormikErrors } from 'formik';
import { SchemaOf, boolean, object } from 'yup';

import { file, withFileSize } from '@@/form-components/yup-file-validation';
import { FileUploadField } from '@@/form-components/FileUpload';
import { SwitchField } from '@@/form-components/SwitchField';
import { FormControl } from '@@/form-components/FormControl';

import { TLSConfig } from './types';

interface Props {
  values: TLSConfig;
  onChange: (value: Partial<TLSConfig>) => void;
  errors?: FormikErrors<TLSConfig>;
}

export function TLSFieldset({ values, onChange, errors }: Props) {
  return (
    <>
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            label="TLS"
            data-cy="enable-tls-switch"
            checked={values.tls}
            onChange={(checked) => handleChange({ tls: checked })}
            labelClass="col-sm-3 col-lg-2"
          />
        </div>
      </div>

      {values.tls && (
        <>
          <div className="form-group">
            <div className="col-sm-12">
              <SwitchField
                label="Skip Certification Verification"
                data-cy="skip-verify-switch"
                checked={!!values.skipVerify}
                onChange={(checked) => handleChange({ skipVerify: checked })}
                labelClass="col-sm-3 col-lg-2"
              />
            </div>
          </div>

          {!values.skipVerify && (
            <>
              <FormControl
                label="TLS CA certificate"
                inputId="ca-cert-field"
                errors={errors?.caCertFile}
              >
                <FileUploadField
                  inputId="ca-cert-field"
                  data-cy="ca-cert-file-upload"
                  onChange={(file) => handleChange({ caCertFile: file })}
                  value={values.caCertFile}
                />
              </FormControl>
              <FormControl
                label="TLS certificate"
                inputId="cert-field"
                errors={errors?.certFile}
              >
                <FileUploadField
                  inputId="cert-field"
                  data-cy="cert-file-upload"
                  onChange={(file) => handleChange({ certFile: file })}
                  value={values.certFile}
                />
              </FormControl>
              <FormControl
                label="TLS key"
                inputId="tls-key-field"
                errors={errors?.keyFile}
              >
                <FileUploadField
                  inputId="tls-key-field"
                  data-cy="tls-key-file-upload"
                  onChange={(file) => handleChange({ keyFile: file })}
                  value={values.keyFile}
                />
              </FormControl>
            </>
          )}
        </>
      )}
    </>
  );

  function handleChange(partialValue: Partial<TLSConfig>) {
    onChange(partialValue);
  }
}

const MAX_FILE_SIZE = 5_242_880; // 5MB

function certValidation(optional?: boolean) {
  return withFileSize(file(), MAX_FILE_SIZE).when(['tls', 'skipVerify'], {
    is: (tls: boolean, skipVerify: boolean) => tls && !skipVerify && !optional,
    then: (schema) => schema.required('File is required'),
  });
}

export function tlsConfigValidation({
  optionalCert,
}: { optionalCert?: boolean } = {}): SchemaOf<TLSConfig> {
  return object({
    tls: boolean().default(false),
    skipVerify: boolean().default(false),
    caCertFile: certValidation(optionalCert),
    certFile: certValidation(optionalCert),
    keyFile: certValidation(optionalCert),
  });
}
