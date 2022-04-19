import { Formik, Form } from 'formik';

import { Switch } from '@/portainer/components/form-components/SwitchField/Switch';
import { FormControl } from '@/portainer/components/form-components/FormControl';
import { Select } from '@/portainer/components/form-components/Input/Select';
import { Widget, WidgetBody, WidgetTitle } from '@/portainer/components/widget';
import { LoadingButton } from '@/portainer/components/Button/LoadingButton';
import { TextTip } from '@/portainer/components/Tip/TextTip';

import { Settings } from '../types';

import styles from './EdgeComputeSettings.module.css';
import { validationSchema } from './EdgeComputeSettings.validation';

export interface FormValues {
  EdgeAgentCheckinInterval: number;
  EnableEdgeComputeFeatures: boolean;
  EnforceEdgeID: boolean;
}

interface Props {
  settings?: Settings;
  onSubmit(values: FormValues): void;
}

const checkinIntervalOptions = [
  {
    value: 5,
    label: '5 seconds',
  },
  {
    value: 10,
    label: '10 seconds',
  },
  {
    value: 30,
    label: '30 seconds',
  },
];

export function EdgeComputeSettings({ settings, onSubmit }: Props) {
  if (!settings) {
    return null;
  }

  const initialValues: FormValues = {
    EdgeAgentCheckinInterval: settings.EdgeAgentCheckinInterval,
    EnableEdgeComputeFeatures: settings.EnableEdgeComputeFeatures,
    EnforceEdgeID: settings.EnforceEdgeID,
  };

  return (
    <div className="row">
      <Widget>
        <WidgetTitle icon="fa-laptop" title="Edge Compute settings" />
        <WidgetBody>
          <Formik
            initialValues={initialValues}
            enableReinitialize
            validationSchema={() => validationSchema()}
            onSubmit={onSubmit}
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
                noValidate
              >
                <FormControl
                  inputId="edge_checkin"
                  label="Edge agent default poll frequency"
                  size="medium"
                  tooltip="Interval used by default by each Edge agent to check in with the Portainer instance. Affects Edge environment management and Edge compute features."
                  errors={errors.EdgeAgentCheckinInterval}
                >
                  <Select
                    value={values.EdgeAgentCheckinInterval}
                    onChange={(e) =>
                      setFieldValue(
                        'EdgeAgentCheckinInterval',
                        parseInt(e.currentTarget.value, 10)
                      )
                    }
                    options={checkinIntervalOptions}
                  />
                </FormControl>

                <FormControl
                  inputId="edge_checkin"
                  label="Enable Edge Compute features"
                  size="medium"
                  errors={errors.EnableEdgeComputeFeatures}
                >
                  <Switch
                    id="edge_enable"
                    name="edge_enable"
                    className="space-right"
                    checked={values.EnableEdgeComputeFeatures}
                    onChange={(e) =>
                      setFieldValue('EnableEdgeComputeFeatures', e)
                    }
                  />
                </FormControl>

                <TextTip color="blue">
                  When enabled, this will enable Portainer to execute Edge
                  Device features.
                </TextTip>

                <FormControl
                  inputId="edge_enforce_id"
                  label="Enforce use of Portainer generated Edge ID"
                  size="medium"
                  tooltip="This setting only applies to manually created environments."
                  errors={errors.EnforceEdgeID}
                >
                  <Switch
                    id="edge_enforce_id"
                    name="edge_enforce_id"
                    className="space-right"
                    checked={values.EnforceEdgeID}
                    onChange={(e) =>
                      setFieldValue('EnforceEdgeID', e.valueOf())
                    }
                  />
                </FormControl>

                <div className="form-group">
                  <div className="col-sm-12">
                    <LoadingButton
                      disabled={!isValid || !dirty}
                      dataCy="settings-edgeComputeButton"
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
