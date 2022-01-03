import {Formik, Form} from 'formik';

import { Switch } from '@/portainer/components/form-components/SwitchField/Switch';
import { FormControl } from '@/portainer/components/form-components/FormControl';
import { Widget, WidgetBody, WidgetTitle } from '@/portainer/components/widget';
import { LoadingButton } from '@/portainer/components/Button/LoadingButton';
import { TextTip } from '@/portainer/components/Tip/TextTip';
import { Input } from "@/portainer/components/form-components/Input";

import styles from './SettingsOpenAMT.module.css';
import { validationSchema } from './SettingsOpenAMT.validation';

export interface FormValues {
  Enabled: boolean,
  OwnerURL: string,
  OwnerUsername: string,
  OwnerPassword: string,
}

export interface Settings {
  FDOConfiguration: FormValues,
  EnableEdgeComputeFeatures: boolean,
}

interface Props {
  settings: Settings;
  onSubmit(values: FormValues): void;
}

export function SettingsOpenAMT({ settings, onSubmit }: Props) {

  const fdoConfiguration = settings ? settings.FDOConfiguration : null;
  const initialValues = {
    Enabled: fdoConfiguration ? fdoConfiguration.Enabled : false,
    OwnerURL: fdoConfiguration ? fdoConfiguration.OwnerURL : '',
    OwnerUsername: fdoConfiguration ? fdoConfiguration.OwnerUsername : '',
    OwnerPassword: fdoConfiguration ? fdoConfiguration.OwnerPassword : '',
  };

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
                  inputId="edge_enableFDO"
                  label="Enable FDO Management Service"
                  errors={errors.Enabled}
                >
                  <Switch
                    id="edge_enableFDO"
                    name="edge_enableFDO"
                    className="space-right"
                    disabled={!edgeComputeFeaturesEnabled}
                    checked={edgeComputeFeaturesEnabled && values.Enabled}
                    onChange={(e) =>
                      setFieldValue('Enabled', e.valueOf())
                    }
                  />
                </FormControl>

                <TextTip color='blue'>
                  When enabled, this will allow Portainer to interact with FDO Services.
                </TextTip>

                {edgeComputeFeaturesEnabled && values.Enabled && (
                  <>
                    <hr />

                    <FormControl
                        inputId="owner_url"
                        label="Owner Service Server"
                        errors={errors.OwnerURL}
                    >
                      <Input
                          name="owner_url"
                          id="owner_url"
                          placeholder="http://127.0.0.1:8042"
                          onChange={(e) => setFieldValue('OwnerURL', e.target.value)}
                          value={values.OwnerURL}
                          data-cy="fdo-serverInput"
                      />
                    </FormControl>

                    <FormControl
                        inputId="owner_username"
                        label="Owner Service Username"
                        errors={errors.OwnerUsername}
                    >
                      <Input
                          name="owner_username"
                          id="owner_username"
                          placeholder="username"
                          onChange={(e) => setFieldValue('OwnerUsername', e.target.value)}
                          value={values.OwnerUsername}
                          data-cy="fdo-usernameInput"
                      />
                    </FormControl>

                    <FormControl
                        inputId="owner_password"
                        label="Owner Service Password"
                        errors={errors.OwnerPassword}
                    >
                      <Input
                          type='password'
                          name="owner_password"
                          id="owner_password"
                          placeholder="password"
                          onChange={(e) => setFieldValue('OwnerPassword', e.target.value)}
                          value={values.OwnerPassword}
                          data-cy="fdo-passwordInput"
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
