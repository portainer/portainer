import { Formik, Form } from 'formik';
import { Laptop, Network } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from '@uirouter/react';
import { boolean, object, SchemaOf, string } from 'yup';

import {
  validation as urlValidation,
  buildDefaultValue as buildUrlDefaultValue,
  PortainerUrlField,
} from '@/react/portainer/common/PortainerUrlField';
import {
  useSettings,
  useUpdateSettingsMutation,
} from '@/react/portainer/settings/queries/useSettings';
import { EnabledWaitingRoomSwitch } from '@/react/portainer/settings/EdgeComputeView/AutomaticEdgeEnvCreation/EnableWaitingRoomSwitch';
import { ConnectivityTestModal } from '@/react/edge/components/ConnectivityTestModal/ConnectivityTestModal';
import { notifySuccess } from '@/portainer/services/notifications';

import { Switch } from '@@/form-components/SwitchField/Switch';
import { FormControl } from '@@/form-components/FormControl';
import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { LoadingButton } from '@@/buttons/LoadingButton';
import { Button } from '@@/buttons';
import { TextTip } from '@@/Tip/TextTip';

interface FormValues {
  EnableEdgeComputeFeatures: boolean;
  EdgePortainerUrl: string;
  EnableWaitingRoom: boolean;
}

export function InitEdgeView() {
  const router = useRouter();
  const updateSettingsMutation = useUpdateSettingsMutation();
  const settingsQuery = useSettings();
  const [isConnectivityModalOpen, setIsConnectivityModalOpen] = useState(false);

  // Prefill the form from the saved settings when they are set (e.g. from the
  // startup CLI flags), falling back to the browser-derived default otherwise.
  const settings = settingsQuery.data;
  const initialValues: FormValues = {
    EnableEdgeComputeFeatures: settings?.EnableEdgeComputeFeatures ?? false,
    EdgePortainerUrl: settings?.EdgePortainerUrl || buildUrlDefaultValue(),
    EnableWaitingRoom: settings ? !settings.TrustOnFirstConnect : true,
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="container">
        <div className="col-md-8 col-md-offset-2 col-sm-10 col-sm-offset-1">
          <Widget>
            <WidgetTitle icon={Laptop} title="Set up Edge Compute" />

            <WidgetBody loading={settingsQuery.isLoading}>
              <p className="text-muted">
                Edge Compute lets Portainer manage environments that it cannot
                reach directly — remote devices, environments behind NAT or a
                firewall, or sites with intermittent connectivity.
              </p>
              <ul className="text-muted ml-4 list-disc">
                <li>
                  Onboard edge agents over a secure reverse tunnel, with no
                  inbound ports to open on the remote side.
                </li>
                <li>
                  Deploy stacks and jobs to many edge environments from a single
                  Portainer instance.
                </li>
              </ul>

              <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                validateOnMount
              >
                {({ values, errors, setFieldValue, isValid }) => (
                  <Form className="form-horizontal mt-4" noValidate>
                    <FormControl
                      inputId="edge_enable"
                      label="Enable Edge Compute features"
                      size="small"
                      errors={errors.EnableEdgeComputeFeatures}
                    >
                      <Switch
                        id="edge_enable"
                        data-cy="init-edge-enable-switch"
                        name="edge_enable"
                        className="space-right"
                        checked={values.EnableEdgeComputeFeatures}
                        onChange={(e) =>
                          setFieldValue('EnableEdgeComputeFeatures', e)
                        }
                      />
                    </FormControl>

                    {values.EnableEdgeComputeFeatures && (
                      <>
                        <TextTip color="blue" className="mb-2">
                          This is the URL that edge agents will use to reach
                          this Portainer instance. It is prefilled from your
                          browser — confirm it is reachable from where your
                          agents run. You can change it later in Settings &gt;
                          Edge Compute.
                        </TextTip>

                        <PortainerUrlField
                          fieldName="EdgePortainerUrl"
                          required
                        />

                        <div className="form-group">
                          <div className="col-sm-12">
                            <Button
                              color="default"
                              icon={Network}
                              onClick={() => setIsConnectivityModalOpen(true)}
                              data-cy="init-edge-test-connectivity-button"
                              className="!ml-0"
                            >
                              Test connectivity
                            </Button>
                          </div>
                        </div>

                        {isConnectivityModalOpen && (
                          <ConnectivityTestModal
                            portainerUrl={values.EdgePortainerUrl}
                            onDismiss={() => setIsConnectivityModalOpen(false)}
                          />
                        )}

                        <EnabledWaitingRoomSwitch />

                        <TextTip color="blue" className="mb-2">
                          When enabled, new edge agents wait for manual approval
                          in Edge Compute &gt; Waiting Room before they are
                          associated. When disabled, agents are automatically
                          trusted on first connect.
                        </TextTip>
                      </>
                    )}

                    <div className="form-group mt-5">
                      <div className="col-sm-12 flex gap-2">
                        <LoadingButton
                          disabled={!isValid}
                          data-cy="init-edge-submit-button"
                          isLoading={updateSettingsMutation.isLoading}
                          loadingText="Saving..."
                        >
                          {values.EnableEdgeComputeFeatures
                            ? 'Enable and continue'
                            : 'Continue'}
                        </LoadingButton>

                        <Button
                          type="button"
                          color="light"
                          onClick={goToWizard}
                          data-cy="init-edge-skip-button"
                        >
                          Skip
                        </Button>
                      </div>
                    </div>
                  </Form>
                )}
              </Formik>
            </WidgetBody>
          </Widget>
        </div>
      </div>
    </div>
  );

  function goToWizard() {
    router.stateService.go('portainer.wizard');
  }

  function handleSubmit(values: FormValues) {
    if (!values.EnableEdgeComputeFeatures) {
      goToWizard();
      return;
    }

    updateSettingsMutation.mutate(
      {
        EnableEdgeComputeFeatures: true,
        EdgePortainerUrl: values.EdgePortainerUrl,
        TrustOnFirstConnect: !values.EnableWaitingRoom,
      },
      {
        onSuccess() {
          notifySuccess('Success', 'Edge Compute enabled');
          goToWizard();
        },
      }
    );
  }
}

function validationSchema(): SchemaOf<FormValues> {
  return object({
    EnableEdgeComputeFeatures: boolean().default(false),
    EnableWaitingRoom: boolean().default(true),
    EdgePortainerUrl: string()
      .default('')
      .when('EnableEdgeComputeFeatures', {
        is: true,
        then: () => urlValidation(),
      }),
  });
}
