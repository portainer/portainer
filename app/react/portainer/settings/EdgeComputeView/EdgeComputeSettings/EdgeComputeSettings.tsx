import { Formik, Form } from 'formik';
import { Laptop } from 'lucide-react';

import { Settings } from '@/react/portainer/settings/types';
import { PortainerUrlField } from '@/react/portainer/common/PortainerUrlField';
import { PortainerTunnelAddrField } from '@/react/portainer/common/PortainerTunnelAddrField';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { Switch } from '@@/form-components/SwitchField/Switch';
import { FormControl } from '@@/form-components/FormControl';
import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { LoadingButton } from '@@/buttons/LoadingButton';
import { TextTip } from '@@/Tip/TextTip';

import { validationSchema } from './EdgeComputeSettings.validation';
import { FormValues } from './types';

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
    Edge: {
      TunnelServerAddress: settings.Edge?.TunnelServerAddress,
    },
    EnforceEdgeID: settings.EnforceEdgeID,
  };

  return (
    <div className="row">
      <Widget>
        <WidgetTitle icon={Laptop} title="Edge Compute settings" />

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

                <TextTip color="blue" className="mb-2">
                  Enable this setting to use Portainer Edge Compute
                  capabilities.
                </TextTip>

                {isBE && values.EnableEdgeComputeFeatures && (
                  <>
                    <PortainerUrlField
                      fieldName="EdgePortainerUrl"
                      tooltip="URL of this Portainer instance that will be used by Edge agents to initiate the communications."
                    />

                    <PortainerTunnelAddrField fieldName="Edge.TunnelServerAddress" />
                  </>
                )}

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
