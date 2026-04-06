import { useState } from 'react';
import { Formik, Field, Form } from 'formik';
import { Laptop } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { OpenAMTConfiguration } from '@/react/edge/edge-devices/open-amt/types';

import { Switch } from '@@/form-components/SwitchField/Switch';
import { FormControl } from '@@/form-components/FormControl';
import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { LoadingButton } from '@@/buttons/LoadingButton';
import { TextTip } from '@@/Tip/TextTip';
import { Input } from '@@/form-components/Input';
import { FileUploadField } from '@@/form-components/FileUpload';
import { Alert } from '@@/Alert';

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
  const { t } = useTranslation();
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
        <WidgetTitle icon={Laptop} title={t('settings.openamt_title')} />
        <WidgetBody>
          <div className="mb-2">
            <Alert color="warn">
              {t('settings.openamt_deprecated')}
            </Alert>
          </div>

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
                  label={t('settings.openamt_enable_label')}
                  errors={errors.enabled}
                  size="small"
                >
                  <Switch
                    id="edge_enableOpenAMT"
                    data-cy="edge-enableOpenAMT-switch"
                    name="edge_enableOpenAMT"
                    className="space-right"
                    disabled={!edgeComputeFeaturesEnabled}
                    checked={edgeComputeFeaturesEnabled && values.enabled}
                    onChange={(e) => setFieldValue('enabled', e)}
                  />
                </FormControl>

                <TextTip color="blue" className="mb-2">
                  {t('settings.openamt_enable_tip')}
                </TextTip>

                {edgeComputeFeaturesEnabled && values.enabled && (
                  <>
                    <hr />

                    <FormControl
                      inputId="mps_server"
                      label={t('settings.mps_server_label')}
                      size="medium"
                      errors={errors.mpsServer}
                    >
                      <Field
                        as={Input}
                        name="mpsServer"
                        id="mps_server"
                        placeholder={t('settings.mps_server_placeholder')}
                        value={values.mpsServer}
                        data-cy="openAMT-serverInput"
                      />
                    </FormControl>

                    <FormControl
                      inputId="mps_username"
                      label={t('settings.mps_user_label')}
                      size="medium"
                      errors={errors.mpsUser}
                    >
                      <Field
                        as={Input}
                        name="mpsUser"
                        id="mps_username"
                        placeholder={t('settings.mps_user_placeholder')}
                        value={values.mpsUser}
                        data-cy="openAMT-usernameInput"
                      />
                    </FormControl>

                    <FormControl
                      inputId="mps_password"
                      label={t('settings.mps_password_label')}
                      size="medium"
                      tooltip={t('settings.mps_password_tooltip')}
                      errors={errors.mpsPassword}
                    >
                      <Field
                        as={Input}
                        type="password"
                        name="mpsPassword"
                        id="mps_password"
                        placeholder={t('settings.mps_password_placeholder')}
                        value={values.mpsPassword}
                        data-cy="openAMT-passwordInput"
                      />
                    </FormControl>

                    <hr />

                    <FormControl
                      inputId="domain_name"
                      label={t('settings.domain_name_label')}
                      size="medium"
                      tooltip={t('settings.domain_name_tooltip')}
                      errors={errors.domainName}
                    >
                      <Field
                        as={Input}
                        name="domainName"
                        id="domain_name"
                        placeholder={t('settings.domain_name_placeholder')}
                        value={values.domainName}
                        data-cy="openAMT-domainInput"
                      />
                    </FormControl>

                    <FormControl
                      inputId="certificate_file"
                      label={t('settings.cert_file_label')}
                      size="medium"
                      tooltip={t('settings.cert_file_tooltip')}
                      errors={errors.certFileContent}
                      setTooltipHtmlMessage
                    >
                      <FileUploadField
                        inputId="certificate_file"
                        data-cy="openAMT-certFileInput"
                        title={t('settings.cert_upload_button')}
                        accept=".pfx"
                        value={certFile}
                        onChange={(file) =>
                          handleFileUpload(file, setFieldValue)
                        }
                      />
                    </FormControl>

                    <FormControl
                      inputId="certificate_password"
                      label={t('settings.cert_password_label')}
                      size="medium"
                      tooltip={t('settings.mps_password_tooltip')}
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

                <div className="form-group mt-5">
                  <div className="col-sm-12">
                    <LoadingButton
                      disabled={!isValid || !dirty}
                      data-cy="settings-OpenAMTButton"
                      isLoading={isSubmitting}
                      loadingText={t('settings.saving_settings')}
                    >
                      {t('settings.save_settings')}
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
