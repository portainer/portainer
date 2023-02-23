import { Formik, Form } from 'formik';
import { Laptop } from 'lucide-react';

import { EdgeCheckinIntervalField } from '@/react/edge/components/EdgeCheckInIntervalField';
import { Settings } from '@/react/portainer/settings/types';

import { Switch } from '@@/form-components/SwitchField/Switch';
import { FormControl } from '@@/form-components/FormControl';
import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { LoadingButton } from '@@/buttons/LoadingButton';
import { TextTip } from '@@/Tip/TextTip';
import { FormSectionTitle } from '@@/form-components/FormSectionTitle';

import { validationSchema } from './EdgeComputeSettings.validation';
import { FormValues } from './types';
import { AddDeviceButton } from './AddDeviceButton';

interface Props {
  settings?: Settings;
  onSubmit(values: FormValues): void;
}

export function EdgeComputeSettings({ settings, onSubmit }: Props) {
  if (!settings) {
    return null;
  }

  const initialValues: FormValues = {
    EnableEdgeComputeFeatures: settings.EnableEdgeComputeFeatures,
    EdgePortainerUrl: settings.EdgePortainerUrl,
    EdgeAgentCheckinInterval: settings.EdgeAgentCheckinInterval,
    EnforceEdgeID: settings.EnforceEdgeID,
  };

  return (
    <div className="row">
      <Widget>
        <WidgetTitle
          icon={Laptop}
          title={
            <>
              <span className="mr-3">Edge Compute settings</span>
              {settings.EnableEdgeComputeFeatures && <AddDeviceButton />}
            </>
          }
        />

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
                  inputId="edge_enable"
                  label="Enable Edge Compute features"
                  size="small"
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
                  size="small"
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

                <FormSectionTitle>Check-in Intervals</FormSectionTitle>

                <EdgeCheckinIntervalField
                  value={values.EdgeAgentCheckinInterval}
                  onChange={(value) =>
                    setFieldValue('EdgeAgentCheckinInterval', value)
                  }
                  isDefaultHidden
                  label="Edge agent default poll frequency"
                  tooltip="Interval used by default by each Edge agent to check in with the Portainer instance. Affects Edge environment management and Edge compute features."
                />

                <div className="form-group mt-5">
                  <div className="col-sm-12">
                    <LoadingButton
                      disabled={!isValid || !dirty}
                      data-cy="settings-edgeComputeButton"
                      isLoading={isSubmitting}
                      loadingText="Saving settings..."
                    >
                      Save settings
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
