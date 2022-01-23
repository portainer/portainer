import { useState } from 'react';
import { Formik, Field, Form } from 'formik';

import { Switch } from '@/portainer/components/form-components/SwitchField/Switch';
import { FormControl } from '@/portainer/components/form-components/FormControl';
import { Widget, WidgetBody, WidgetTitle } from '@/portainer/components/widget';
import { LoadingButton } from '@/portainer/components/Button/LoadingButton';
import { TextTip } from '@/portainer/components/Tip/TextTip';
import { Input } from '@/portainer/components/form-components/Input';
import { FileUploadField } from '@/portainer/components/form-components/FileUpload';
import { OpenAMTConfiguration } from '@/portainer/hostmanagement/open-amt/model';

import styles from './SettingsOpenAMT.module.css';
import { validationSchema } from './SettingsOpenAMT.validation';

export interface Settings {
  openAMTConfiguration: OpenAMTConfiguration;
  EnableEdgeComputeFeatures: boolean;
}

interface Props {
  settings: Settings;
  onSubmit(values: OpenAMTConfiguration): void;
}

export function SettingsOpenAMT({ settings, onSubmit }: Props) {
  const [certFile, setCertFile] = useState<File>();
  async function handleFileUpload(
    file: File,
    setFieldValue: (
      field: string,
      value: unknown,
      shouldValidate?: boolean
    ) => void
  ) {
    if (file) {
      setCertFile(file);
      const fileContent = await readFileContent(file);
      setFieldValue('certFileContent', fileContent);
      setFieldValue('certFileName', file.name);
    }
  }

  function readFileContent(file: File) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        if (e.target == null || e.target.result == null) {
          resolve('');
          return;
        }
        const base64 = e.target.result.toString();
        // remove prefix of "data:application/x-pkcs12;base64," returned by "readAsDataURL()"
        const index = base64.indexOf('base64,');
        const cert = base64.substring(index + 7, base64.length);
        resolve(cert);
      };
      fileReader.onerror = () => {
        reject(new Error('error reading provisioning certificate file'));
      };
      fileReader.readAsDataURL(file);
    });
  }

  const openAMTConfiguration = settings ? settings.openAMTConfiguration : null;
  const initialValues = {
    enabled: openAMTConfiguration ? openAMTConfiguration.enabled : false,
    mpsServer: openAMTConfiguration ? openAMTConfiguration.mpsServer : '',
    mpsUser: openAMTConfiguration ? openAMTConfiguration.mpsUser : '',
    mpsPassword: openAMTConfiguration ? openAMTConfiguration.mpsPassword : '',
    domainName: openAMTConfiguration ? openAMTConfiguration.domainName : '',
    certFileContent: openAMTConfiguration
      ? openAMTConfiguration.certFileContent
      : '',
    certFileName: openAMTConfiguration ? openAMTConfiguration.certFileName : '',
    certFilePassword: openAMTConfiguration
      ? openAMTConfiguration.certFilePassword
      : '',
  };

  if (
    initialValues.certFileContent &&
    initialValues.certFileName &&
    !certFile
  ) {
    setCertFile(new File([], initialValues.certFileName));
  }

  const edgeComputeFeaturesEnabled = settings
    ? settings.EnableEdgeComputeFeatures
    : false;

  return (
    <div className="row">
      <Widget>
        <WidgetTitle icon="fa-laptop" title="Intel OpenAMT" />
        <WidgetBody>
          <Formik
            initialValues={initialValues}
            onSubmit={onSubmit}
            enableReinitialize
            validationSchema={() => validationSchema()}
            validateOnChange
            validateOnMount
          >
            {({
              values,
              errors,
              handleSubmit,
              setFieldValue,
              isSubmitting,
              isValid,
              dirty,
            }) => (
              <Form className="form-horizontal" onSubmit={handleSubmit}>
                <FormControl
                  inputId="edge_enableOpenAMT"
                  label="Enable OpenAMT"
                  errors={errors.enabled}
                >
                  <Switch
                    id="edge_enableOpenAMT"
                    name="edge_enableOpenAMT"
                    className="space-right"
                    disabled={!edgeComputeFeaturesEnabled}
                    checked={edgeComputeFeaturesEnabled && values.enabled}
                    onChange={(e) => setFieldValue('enabled', e)}
                  />
                </FormControl>

                <TextTip color="blue">
                  When enabled, this will allow Portainer to interact with an
                  OpenAMT MPS API.
                </TextTip>

                {edgeComputeFeaturesEnabled && values.enabled && (
                  <>
                    <hr />

                    <FormControl
                      inputId="mps_server"
                      label="MPS Server"
                      size="medium"
                      errors={errors.mpsServer}
                    >
                      <Field
                        as={Input}
                        name="mpsServer"
                        id="mps_server"
                        placeholder="Enter the MPS Server"
                        value={values.mpsServer}
                        data-cy="openAMT-serverInput"
                      />
                    </FormControl>

                    <FormControl
                      inputId="mps_username"
                      label="MPS User"
                      size="medium"
                      errors={errors.mpsUser}
                    >
                      <Field
                        as={Input}
                        name="mpsUser"
                        id="mps_username"
                        placeholder="Enter the MPS User"
                        value={values.mpsUser}
                        data-cy="openAMT-usernameInput"
                      />
                    </FormControl>

                    <FormControl
                      inputId="mps_password"
                      label="MPS Password"
                      size="medium"
                      tooltip="Needs to be 8-32 characters including one uppercase, one lowercase letters, one base-10 digit and one special character."
                      errors={errors.mpsPassword}
                    >
                      <Field
                        as={Input}
                        type="password"
                        name="mpsPassword"
                        id="mps_password"
                        placeholder="Enter the MPS Password"
                        value={values.mpsPassword}
                        data-cy="openAMT-passwordInput"
                      />
                    </FormControl>

                    <hr />

                    <FormControl
                      inputId="domain_name"
                      label="Domain Name"
                      size="medium"
                      tooltip="Enter the FQDN that is associated with the provisioning certificate (i.e amtdomain.com)"
                      errors={errors.domainName}
                    >
                      <Field
                        as={Input}
                        name="domainName"
                        id="domain_name"
                        placeholder="Enter the Domain Name"
                        value={values.domainName}
                        data-cy="openAMT-domainInput"
                      />
                    </FormControl>

                    <FormControl
                      inputId="certificate_file"
                      label="Provisioning Certificate File (.pfx)"
                      size="medium"
                      tooltip="Supported CAs are Comodo, DigiCert, Entrust and GoDaddy.<br>The certificate must contain the private key.<br>On AMT 15 based devices you need to use SHA2."
                      errors={errors.certFileContent}
                    >
                      <FileUploadField
                        title="Upload file"
                        accept=".pfx"
                        value={certFile}
                        onChange={(file) =>
                          handleFileUpload(file, setFieldValue)
                        }
                      />
                    </FormControl>

                    <FormControl
                      inputId="certificate_password"
                      label="Provisioning Certificate Password"
                      size="medium"
                      tooltip="Needs to be 8-32 characters including one uppercase, one lowercase letters, one base-10 digit and one special character."
                      errors={errors.certFilePassword}
                    >
                      <Field
                        as={Input}
                        type="password"
                        name="certFilePassword"
                        id="certificate_password"
                        placeholder="**********"
                        value={values.certFilePassword}
                        data-cy="openAMT-certPasswordInput"
                      />
                    </FormControl>
                  </>
                )}

                <div className="form-group">
                  <div className="col-sm-12">
                    <LoadingButton
                      disabled={!isValid || !dirty}
                      dataCy="settings-fdoButton"
                      className={styles.saveButton}
                      isLoading={isSubmitting}
                      loadingText="Saving settings..."
                    >
                      Save Settings
                    </LoadingButton>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </WidgetBody>
      </Widget>
    </div>
  );
}
