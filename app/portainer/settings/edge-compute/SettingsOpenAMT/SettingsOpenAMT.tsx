import {useState} from "react";
import {Formik, Form} from 'formik';

import { Switch } from '@/portainer/components/form-components/SwitchField/Switch';
import { FormControl } from '@/portainer/components/form-components/FormControl';
import { Widget, WidgetBody, WidgetTitle } from '@/portainer/components/widget';
import { LoadingButton } from '@/portainer/components/Button/LoadingButton';
import { TextTip } from '@/portainer/components/Tip/TextTip';
import { Input } from "@/portainer/components/form-components/Input";
import { FileUploadField } from "@/portainer/components/form-components/FileUpload";
import {OpenAMTConfiguration} from "@/portainer/hostmanagement/open-amt/model";

import styles from './SettingsOpenAMT.module.css';
import { validationSchema } from './SettingsOpenAMT.validation';

export interface Settings {
  OpenAMTConfiguration: OpenAMTConfiguration,
  EnableEdgeComputeFeatures: boolean,
}

interface Props {
  settings: Settings;
  onSubmit(values: OpenAMTConfiguration): void;
}

export function SettingsOpenAMT({ settings, onSubmit }: Props) {

  const [certFile, setCertFile] = useState<File>();
  async function handleFileUpload(file: File, setFieldValue: (field: string, value: unknown, shouldValidate?: boolean) => void) {
    if (file) {
      setCertFile(file);
      const fileContent = await readFileContent(file);
      setFieldValue("CertFileContent", fileContent);
      setFieldValue("CertFileName", file.name);
    }
  }

  function readFileContent(file: File) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        if (e.target == null || e.target.result == null) {
          resolve("");
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

  const openAMTConfiguration = settings ? settings.OpenAMTConfiguration : null;
  const initialValues = {
    Enabled: openAMTConfiguration ? openAMTConfiguration.Enabled : false,
    MPSServer: openAMTConfiguration ? openAMTConfiguration.MPSServer : '',
    MPSUser: openAMTConfiguration && openAMTConfiguration ? openAMTConfiguration.MPSUser : '',
    MPSPassword: openAMTConfiguration && openAMTConfiguration ? openAMTConfiguration.MPSPassword : '',
    DomainName: openAMTConfiguration && openAMTConfiguration ? openAMTConfiguration.DomainName : '',
    CertFileContent: openAMTConfiguration && openAMTConfiguration ? openAMTConfiguration.CertFileContent : '',
    CertFileName: openAMTConfiguration && openAMTConfiguration ? openAMTConfiguration.CertFileName : '',
    CertFilePassword: openAMTConfiguration && openAMTConfiguration ? openAMTConfiguration.CertFilePassword : '',
  };

  if (initialValues.CertFileContent && initialValues.CertFileName && !certFile) {
    setCertFile(new File([], initialValues.CertFileName));
  }

  const edgeComputeFeaturesEnabled = settings.EnableEdgeComputeFeatures;

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
              <Form
                className="form-horizontal"
                onSubmit={handleSubmit}
              >
                <FormControl
                  inputId="edge_enableOpenAMT"
                  label="Enable edge OpenAMT"
                  errors={errors.Enabled}
                >
                  <Switch
                    id="edge_enableOpenAMT"
                    name="edge_enableOpenAMT"
                    className="space-right"
                    disabled={!edgeComputeFeaturesEnabled}
                    checked={edgeComputeFeaturesEnabled && values.Enabled}
                    onChange={(e) =>
                      setFieldValue('Enabled', e.valueOf())
                    }
                  />
                </FormControl>

                <TextTip color='blue'>
                  When enabled, this will allow Portainer to interact with an OpenAMT MPS API.
                </TextTip>

                {edgeComputeFeaturesEnabled && values.Enabled && (
                  <>
                    <hr />

                    <FormControl
                        inputId="mps_server"
                        label="MPS Server"
                        errors={errors.MPSServer}
                    >
                      <Input
                          name="mps_server"
                          id="mps_server"
                          placeholder="Enter the MPS Server"
                          onChange={(e) => setFieldValue('MPSServer', e.target.value)}
                          value={values.MPSServer}
                          data-cy="openAMT-serverInput"
                      />
                    </FormControl>

                    <FormControl
                        inputId="mps_username"
                        label="MPS User"
                        errors={errors.MPSUser}
                    >
                      <Input
                          name="mps_username"
                          id="mps_username"
                          placeholder="Enter the MPS User"
                          onChange={(e) => setFieldValue('MPSUser', e.target.value)}
                          value={values.MPSUser}
                          data-cy="openAMT-usernameInput"
                      />
                    </FormControl>

                    <FormControl
                        inputId="mps_password"
                        label="MPS Password"
                        tooltip="Needs to be 8-32 characters including one uppercase, one lowercase letters, one base-10 digit and one special character."
                        errors={errors.MPSPassword}
                    >
                      <Input
                          type='password'
                          name="mps_password"
                          id="mps_password"
                          placeholder="Enter the MPS Password"
                          onChange={(e) => setFieldValue('MPSPassword', e.target.value)}
                          value={values.MPSPassword}
                          data-cy="openAMT-passwordInput"
                      />
                    </FormControl>

                    <hr />

                    <FormControl
                        inputId="domain_name"
                        label="Domain Name"
                        tooltip="Enter the FQDN that is associated with the provisioning certificate (i.e amtdomain.com)"
                        errors={errors.DomainName}
                    >
                      <Input
                          name="domain_name"
                          id="domain_name"
                          placeholder="Enter the Domain Name"
                          onChange={(e) => setFieldValue('DomainName', e.target.value)}
                          value={values.DomainName}
                          data-cy="openAMT-domainInput"
                      />
                    </FormControl>

                    <FormControl
                        inputId="certificate_file"
                        label="Provisioning Certificate File (.pfx)"
                        tooltip="Supported CAs are Comodo, DigiCert, Entrust and GoDaddy. The certificate must contain the private key."
                        errors={errors.CertFileContent}
                    >
                      <FileUploadField
                          title="Upload file"
                          accept=".pfx"
                          value={certFile}
                          onChange={(file) => handleFileUpload(file, setFieldValue)}
                      />
                    </FormControl>

                    <FormControl
                        inputId="certificate_password"
                        label="Provisioning Certificate Password"
                        tooltip="Needs to be 8-32 characters including one uppercase, one lowercase letters, one base-10 digit and one special character."
                        errors={errors.CertFilePassword}
                    >
                      <Input
                          type='password'
                          name="certificate_password"
                          id="certificate_password"
                          placeholder="**********"
                          onChange={(e) => setFieldValue('CertFilePassword', e.target.value)}
                          value={values.CertFilePassword}
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
