import { useEffect, useState } from 'react';
import { Formik, Field, Form } from 'formik';

import { Switch } from '@/portainer/components/form-components/SwitchField/Switch';
import { FormControl } from '@/portainer/components/form-components/FormControl';
import { FormSectionTitle } from '@/portainer/components/form-components/FormSectionTitle';
import { Widget, WidgetBody, WidgetTitle } from '@/portainer/components/widget';
import { LoadingButton } from '@/portainer/components/Button/LoadingButton';
import { TextTip } from '@/portainer/components/Tip/TextTip';
import { Input } from '@/portainer/components/form-components/Input';
import { FDOConfiguration } from '@/portainer/hostmanagement/fdo/model';
import { FDOProfilesDatatableContainer } from '@/portainer/settings/edge-compute/FDOProfilesDatatable/FDOProfilesDatatableContainer';

import styles from './SettingsFDO.module.css';
import { validationSchema } from './SettingsFDO.validation';

export interface Settings {
  fdoConfiguration: FDOConfiguration;
  EnableEdgeComputeFeatures: boolean;
}

interface Props {
  settings: Settings;
  onSubmit(values: FDOConfiguration): void;
}

export function SettingsFDO({ settings, onSubmit }: Props) {
  const fdoConfiguration = settings ? settings.fdoConfiguration : null;
  const initialFDOEnabled = fdoConfiguration ? fdoConfiguration.enabled : false;

  const [isFDOEnabled, setIsFDOEnabled] = useState(initialFDOEnabled);
  useEffect(() => {
    setIsFDOEnabled(settings?.fdoConfiguration?.enabled);
  }, [settings]);

  const initialValues = {
    enabled: initialFDOEnabled,
    ownerURL: fdoConfiguration ? fdoConfiguration.ownerURL : '',
    ownerUsername: fdoConfiguration ? fdoConfiguration.ownerUsername : '',
    ownerPassword: fdoConfiguration ? fdoConfiguration.ownerPassword : '',
  };

  const edgeComputeFeaturesEnabled = settings
    ? settings.EnableEdgeComputeFeatures
    : false;

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
              <Form className="form-horizontal" onSubmit={handleSubmit}>
                <FormControl
                  inputId="edge_enableFDO"
                  label="Enable FDO Management Service"
                  size="medium"
                  errors={errors.enabled}
                >
                  <Switch
                    id="edge_enableFDO"
                    name="edge_enableFDO"
                    className="space-right"
                    disabled={!edgeComputeFeaturesEnabled}
                    checked={edgeComputeFeaturesEnabled && values.enabled}
                    onChange={(e) => onChangedEnabled(e, setFieldValue)}
                  />
                </FormControl>

                <TextTip color="blue">
                  When enabled, this will allow Portainer to interact with FDO
                  Services.
                </TextTip>

                {edgeComputeFeaturesEnabled && values.enabled && (
                  <>
                    <hr />

                    <FormControl
                      inputId="owner_url"
                      label="Owner Service Server"
                      errors={errors.ownerURL}
                    >
                      <Field
                        as={Input}
                        name="ownerURL"
                        id="owner_url"
                        placeholder="http://127.0.0.1:8042"
                        value={values.ownerURL}
                        data-cy="fdo-serverInput"
                      />
                    </FormControl>

                    <FormControl
                      inputId="owner_username"
                      label="Owner Service Username"
                      errors={errors.ownerUsername}
                    >
                      <Field
                        as={Input}
                        name="ownerUsername"
                        id="owner_username"
                        placeholder="username"
                        value={values.ownerUsername}
                        data-cy="fdo-usernameInput"
                      />
                    </FormControl>

                    <FormControl
                      inputId="owner_password"
                      label="Owner Service Password"
                      errors={errors.ownerPassword}
                    >
                      <Field
                        as={Input}
                        type="password"
                        name="ownerPassword"
                        id="owner_password"
                        placeholder="password"
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

          {edgeComputeFeaturesEnabled && isFDOEnabled && (
            <div className={styles.fdoTable}>
              <FormSectionTitle>Device Profiles</FormSectionTitle>
              <TextTip color="blue">
                Add, Edit and Manage the list of device profiles available
                during FDO device setup
              </TextTip>
              <FDOProfilesDatatableContainer isFDOEnabled={initialFDOEnabled} />
            </div>
          )}
        </WidgetBody>
      </Widget>
    </div>
  );

  async function onChangedEnabled(
    e: boolean,
    setFieldValue: (
      field: string,
      value: unknown,
      shouldValidate?: boolean
    ) => void
  ) {
    setIsFDOEnabled(e);
    setFieldValue('enabled', e);
  }
}
