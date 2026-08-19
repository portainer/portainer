import { FormikErrors } from 'formik';

import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { isLimitedToBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { FileUploadField } from '@@/form-components/FileUpload';
import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';
import { SwitchField } from '@@/form-components/SwitchField';
import { BEFeatureIndicator } from '@@/BEFeatureIndicator';

export interface LdapSecurityConfig {
  startTLS: boolean;
  tls: boolean;
  tlsSkipVerify: boolean;
  caCertFile?: File | null;
}

interface Props {
  values: LdapSecurityConfig;
  onChange: (value: Partial<LdapSecurityConfig>) => void;
  errors?: FormikErrors<LdapSecurityConfig>;
  title?: string;
  uploadState?: 'uploading' | 'success';
  limitedFeatureId?: FeatureId;
}

export function LdapSecurityFieldset({
  values,
  onChange,
  errors,
  title = 'LDAP security',
  uploadState,
  limitedFeatureId,
}: Props) {
  const showCaCert = values.tls || (values.startTLS && !values.tlsSkipVerify);
  const isCaCertLimited = isLimitedToBE(limitedFeatureId);

  return (
    <FormSection title={title}>
      {!values.tls && (
        <div className="form-group">
          <div className="col-sm-12">
            <SwitchField
              label="Use StartTLS"
              checked={values.startTLS}
              onChange={(checked) => onChange({ startTLS: checked })}
              tooltip="Enable this option if you want to use StartTLS to secure the connection to the server. Ignored if Use TLS is selected."
              labelClass="col-sm-3 col-lg-2"
              featureId={limitedFeatureId}
              data-cy="starttls-toggle"
            />
          </div>
        </div>
      )}

      {!values.startTLS && (
        <div className="form-group">
          <div className="col-sm-12">
            <SwitchField
              label="Use TLS"
              checked={values.tls}
              onChange={(checked) => onChange({ tls: checked })}
              tooltip="Enable this option if you need to specify TLS certificates to connect to the LDAP server."
              labelClass="col-sm-3 col-lg-2"
              featureId={limitedFeatureId}
              data-cy="tls-toggle"
            />
          </div>
        </div>
      )}

      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            label="Skip verification of server certificate"
            checked={values.tlsSkipVerify}
            onChange={(checked) => onChange({ tlsSkipVerify: checked })}
            tooltip="Skip the verification of the server TLS certificate. Not recommended on unsecured networks."
            labelClass="col-sm-3 col-lg-2"
            featureId={limitedFeatureId}
            data-cy="tls-skip-verify-toggle"
          />
        </div>
      </div>

      {showCaCert && (
        <FormControl
          label="TLS CA certificate"
          errors={errors?.caCertFile}
          inputId="tls-ca-cert"
        >
          <FileUploadField
            inputId="tls-ca-cert"
            onChange={(file) => onChange({ caCertFile: file })}
            value={values.caCertFile}
            title="Select file"
            required
            data-cy="tls-ca-cert-upload"
            state={uploadState}
            disabled={isCaCertLimited}
          />
          {limitedFeatureId && (
            <BEFeatureIndicator featureId={limitedFeatureId} />
          )}
        </FormControl>
      )}
    </FormSection>
  );
}
