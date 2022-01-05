import {Formik, Form} from 'formik';

import { Switch } from '@/portainer/components/form-components/SwitchField/Switch';
import { FormControl } from '@/portainer/components/form-components/FormControl';
import { Widget, WidgetBody, WidgetTitle } from '@/portainer/components/widget';
import { LoadingButton } from '@/portainer/components/Button/LoadingButton';
import { TextTip } from '@/portainer/components/Tip/TextTip';
import { Input } from "@/portainer/components/form-components/Input";
import { FDOConfiguration } from "@/portainer/hostmanagement/fdo/model";

import styles from './SettingsFDO.module.css';
import { validationSchema } from './SettingsFDO.validation';

export interface Settings {
  fdoConfiguration: FDOConfiguration,
  EnableEdgeComputeFeatures: boolean,
}

interface Props {
  settings: Settings;
  onSubmit(values: FDOConfiguration): void;
}

export function SettingsFDO({ settings, onSubmit }: Props) {

  const fdoConfiguration = settings ? settings.fdoConfiguration : null;
  const initialValues = {
    enabled: fdoConfiguration ? fdoConfiguration.enabled : false,
    ownerURL: fdoConfiguration ? fdoConfiguration.ownerURL : '',
    ownerUsername: fdoConfiguration ? fdoConfiguration.ownerUsername : '',
    ownerPassword: fdoConfiguration ? fdoConfiguration.ownerPassword : '',
  };

  const edgeComputeFeaturesEnabled = settings.EnableEdgeComputeFeatures;

  return (
    <div className="row">
      <Widget>
        <WidgetTitle icon="fa-laptop" title="FDO" />
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
                  errors={errors.enabled}
                >
                  <Switch
                    id="edge_enableFDO"
                    name="edge_enableFDO"
                    className="space-right"
                    disabled={!edgeComputeFeaturesEnabled}
                    checked={edgeComputeFeaturesEnabled && values.enabled}
                    onChange={(e) =>
                      setFieldValue('enabled', e.valueOf())
                    }
                  />
                </FormControl>

                <TextTip color='blue'>
                  When enabled, this will allow Portainer to interact with FDO Services.
                </TextTip>

                {edgeComputeFeaturesEnabled && values.enabled && (
                  <>
                    <hr />

                    <FormControl
                        inputId="owner_url"
                        label="Owner Service Server"
                        errors={errors.ownerURL}
                    >
                      <Input
                          name="owner_url"
                          id="owner_url"
                          placeholder="http://127.0.0.1:8042"
                          onChange={(e) => setFieldValue('ownerURL', e.target.value)}
                          value={values.ownerURL}
                          data-cy="fdo-serverInput"
                      />
                    </FormControl>

                    <FormControl
                        inputId="owner_username"
                        label="Owner Service Username"
                        errors={errors.ownerUsername}
                    >
                      <Input
                          name="owner_username"
                          id="owner_username"
                          placeholder="username"
                          onChange={(e) => setFieldValue('ownerUsername', e.target.value)}
                          value={values.ownerUsername}
                          data-cy="fdo-usernameInput"
                      />
                    </FormControl>

                    <FormControl
                        inputId="owner_password"
                        label="Owner Service Password"
                        errors={errors.ownerPassword}
                    >
                      <Input
                          type='password'
                          name="owner_password"
                          id="owner_password"
                          placeholder="password"
                          onChange={(e) => setFieldValue('ownerPassword', e.target.value)}
                          value={values.ownerPassword}
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
