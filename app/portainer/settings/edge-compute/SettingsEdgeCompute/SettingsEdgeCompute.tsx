import { Formik, Form } from 'formik';

import { Switch } from "@/portainer/components/form-components/SwitchField/Switch";
import { FormControl } from '@/portainer/components/form-components/FormControl';
import { Select } from '@/portainer/components/form-components/Input/Select';
import { Widget, WidgetBody, WidgetTitle } from '@/portainer/components/widget';
import { LoadingButton } from '@/portainer/components/Button/LoadingButton';

export interface FormValues {
    EdgeAgentCheckinInterval: number;
    EnableEdgeComputeFeatures: boolean;
}

interface Props {
    // settings: FormValues; //TODO
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
    }
];

export function SettingsEdgeCompute({ onSubmit }: Props) {
  // TODO load from settings
    const initialValues = {
        EdgeAgentCheckinInterval: 5,
        EnableEdgeComputeFeatures: false,
  };

  return (
      <div className="row">
        <Widget>
          <WidgetTitle icon="fa-laptop" title="Edge Compute settings" />
          <WidgetBody>
            <Formik
                initialValues={initialValues}
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
                        tooltip="Interval used by default by each Edge agent to check in with the Portainer instance. Affects Edge environment management and Edge compute features."
                        errors={errors.EdgeAgentCheckinInterval}
                    >
                      <Select
                          value={values.EdgeAgentCheckinInterval}
                          onChange={(e) =>
                              setFieldValue('EdgeAgentCheckinInterval', parseInt(e.currentTarget.value, 10))
                          }
                          options={checkinIntervalOptions}
                      />
                    </FormControl>

                      <FormControl
                          inputId="edge_checkin"
                          label="Enable Edge Compute features"
                          errors={errors.EnableEdgeComputeFeatures}
                      >
                          <Switch
                              id="edge_enable"
                              name="edge_enable"
                              className="space-right"
                              checked={values.EnableEdgeComputeFeatures}
                              onChange={(e) =>
                                  setFieldValue('EnableEdgeComputeFeatures', e.valueOf())
                              }
                          />
                      </FormControl>

                    <div className="form-group">
                      <div className="col-sm-12">
                        <LoadingButton
                            disabled={!isValid || !dirty}
                            dataCy="settings-edgeComputeButton"
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
