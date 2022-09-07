import { Form, Formik } from 'formik';
import { useReducer } from 'react';

import { EdgeCheckinIntervalField } from '@/edge/components/EdgeCheckInIntervalField';
import { EdgeAsyncIntervalsForm } from '@/edge/components/EdgeAsyncIntervalsForm';
import { notifySuccess } from '@/portainer/services/notifications';

import { FormControl } from '@@/form-components/FormControl';
import { Switch } from '@@/form-components/SwitchField/Switch';
import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { FormSection } from '@@/form-components/FormSection';
import { LoadingButton } from '@@/buttons/LoadingButton';
import { TextTip } from '@@/Tip/TextTip';

import { useSettings, useUpdateSettingsMutation } from '../../queries';

import { FormValues } from './types';

const asyncIntervalFieldSettings = {
  ping: {
    label: 'Edge agent default ping frequency',
    tooltip:
      'Interval used by default by each Edge agent to ping the Portainer instance. Affects Edge environment management and Edge compute features.',
  },
  snapshot: {
    label: 'Edge agent default snapshot frequency',
    tooltip:
      'Interval used by default by each Edge agent to snapshot the agent state.',
  },
  command: {
    label: 'Edge agent default command frequency',
    tooltip: 'Interval used by default by each Edge agent to execute commands.',
  },
};

export function DeploymentSyncOptions() {
  const settingsQuery = useSettings();
  const settingsMutation = useUpdateSettingsMutation();
  const [formKey, resetForm] = useReducer((state) => state + 1, 0);

  if (!settingsQuery.data) {
    return null;
  }

  const initialValues = {
    Edge: settingsQuery.data.Edge,
    EdgeAgentCheckinInterval: settingsQuery.data.EdgeAgentCheckinInterval,
  };

  return (
    <div className="row">
      <Widget>
        <WidgetTitle icon="svg-laptop" title="Deployment sync options" />
        <WidgetBody>
          <Formik<FormValues>
            initialValues={initialValues}
            onSubmit={handleSubmit}
            key={formKey}
          >
            {({ errors, setFieldValue, values, isValid, dirty }) => (
              <Form className="form-horizontal">
                <FormControl
                  inputId="edge_async_mode"
                  label="Use Async mode by default"
                  size="small"
                  errors={errors?.Edge?.AsyncMode}
                  tooltip="Using Async allows the ability to define different ping,
                  snapshot and command frequencies."
                >
                  <Switch
                    id="edge_async_mode"
                    name="edge_async_mode"
                    className="space-right"
                    checked={values.Edge.AsyncMode}
                    onChange={(e) =>
                      setFieldValue('Edge.AsyncMode', e.valueOf())
                    }
                  />
                </FormControl>

                <TextTip color="orange">
                  Enabling Async disables the tunnel function.
                </TextTip>

                <FormSection title="Check-in Intervals">
                  {!values.Edge.AsyncMode ? (
                    <EdgeCheckinIntervalField
                      value={values.EdgeAgentCheckinInterval}
                      onChange={(value) =>
                        setFieldValue('EdgeAgentCheckinInterval', value)
                      }
                      isDefaultHidden
                      label="Edge agent default poll frequency"
                      tooltip="Interval used by default by each Edge agent to check in with the Portainer instance. Affects Edge environment management and Edge compute features."
                    />
                  ) : (
                    <EdgeAsyncIntervalsForm
                      values={values.Edge}
                      onChange={(value) => setFieldValue('Edge', value)}
                      isDefaultHidden
                      fieldSettings={asyncIntervalFieldSettings}
                    />
                  )}
                </FormSection>

                <FormSection title="Actions">
                  <div className="form-group mt-5">
                    <div className="col-sm-12">
                      <LoadingButton
                        disabled={!isValid || !dirty}
                        data-cy="settings-deploySyncOptionsButton"
                        isLoading={settingsMutation.isLoading}
                        loadingText="Saving settings..."
                      >
                        Save settings
                      </LoadingButton>
                    </div>
                  </div>
                </FormSection>
              </Form>
            )}
          </Formik>
        </WidgetBody>
      </Widget>
    </div>
  );

  function handleSubmit(values: FormValues) {
    settingsMutation.mutate(
      {
        Edge: values.Edge,
        EdgeAgentCheckinInterval: values.EdgeAgentCheckinInterval,
      },
      {
        onSuccess() {
          notifySuccess('Success', 'Settings updated successfully');
          resetForm();
        },
      }
    );
  }
}
