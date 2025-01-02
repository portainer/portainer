import { useFormikContext } from 'formik';

import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { Authorized } from '@/react/hooks/useUser';
import { AccessControlForm } from '@/react/portainer/access-control';
import { AccessControlFormData } from '@/react/portainer/access-control/types';
import { EnvironmentType } from '@/react/portainer/environments/types';
import { NodeSelector } from '@/react/docker/agent/NodeSelector';
import { useIsSwarm } from '@/react/docker/proxy/queries/useInfo';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';
import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { FormSection } from '@@/form-components/FormSection';
import { SwitchField } from '@@/form-components/SwitchField';
import { ImageConfigFieldset, ImageConfigValues } from '@@/ImageConfigFieldset';
import { LoadingButton } from '@@/buttons';
import { Widget } from '@@/Widget';

import {
  PortsMappingField,
  Values as PortMappingValue,
} from './PortsMappingField';
import { NameField } from './NameField';

export interface Values {
  name: string;
  enableWebhook: boolean;
  publishAllPorts: boolean;
  image: ImageConfigValues;
  alwaysPull: boolean;
  ports: PortMappingValue;
  accessControl: AccessControlFormData;
  nodeName: string;
  autoRemove: boolean;
}

function useIsAgentOnSwarm() {
  const environmentId = useEnvironmentId();
  const environmentQuery = useCurrentEnvironment();

  const isSwarm = useIsSwarm(environmentId);

  return (
    !!environmentQuery.data &&
    isAgentEnvironment(environmentQuery.data?.Type) &&
    isSwarm
  );
}

export function BaseForm({
  isLoading,
  onChangeName,
  onChangeImageName,
  onRateLimit,
}: {
  isLoading: boolean;
  onChangeName: (value: string) => void;
  onChangeImageName: () => void;
  onRateLimit: (limited?: boolean) => void;
}) {
  const { setFieldValue, values, errors, isValid } = useFormikContext<Values>();
  const environmentQuery = useCurrentEnvironment();
  const isAgentOnSwarm = useIsAgentOnSwarm();
  if (!environmentQuery.data) {
    return null;
  }

  const environment = environmentQuery.data;

  const canUseWebhook = environment.Type !== EnvironmentType.EdgeAgentOnDocker;

  return (
    <Widget>
      <Widget.Body>
        <NameField
          value={values.name}
          onChange={(name) => {
            setFieldValue('name', name);
            onChangeName(name);
          }}
          error={errors?.name}
        />

        <FormSection title="Image Configuration">
          <ImageConfigFieldset
            values={values.image}
            setFieldValue={(field, value) =>
              setFieldValue(`image.${field}`, value)
            }
            autoComplete
            onRateLimit={values.alwaysPull ? onRateLimit : undefined}
            errors={errors?.image}
            onChangeImage={onChangeImageName}
          >
            <div className="form-group">
              <div className="col-sm-12">
                <SwitchField
                  label="Always pull the image"
                  tooltip="When enabled, Portainer will automatically try to pull the specified image before creating the container."
                  checked={values.alwaysPull}
                  onChange={(alwaysPull) =>
                    setFieldValue('alwaysPull', alwaysPull)
                  }
                  labelClass="col-sm-3 col-lg-2"
                  data-cy="always-pull-switch"
                />
              </div>
            </div>
          </ImageConfigFieldset>
        </FormSection>

        {canUseWebhook && (
          <Authorized authorizations="PortainerWebhookCreate" adminOnlyCE>
            <FormSection title="Webhook">
              <div className="form-group">
                <div className="col-sm-12">
                  <SwitchField
                    label="Create a container webhook"
                    data-cy="container-webhook-switch"
                    tooltip="Create a webhook (or callback URI) to automate the recreate this container. Sending a POST request to this callback URI (without requiring any authentication) will pull the most up-to-date version of the associated image and recreate this container."
                    checked={values.enableWebhook}
                    onChange={(enableWebhook) =>
                      setFieldValue('enableWebhook', enableWebhook)
                    }
                    featureId={FeatureId.CONTAINER_WEBHOOK}
                    labelClass="col-sm-3 col-lg-2"
                  />
                </div>
              </div>
            </FormSection>
          </Authorized>
        )}

        <FormSection title="Network ports configuration">
          <div className="form-group">
            <div className="col-sm-12">
              <SwitchField
                label="Publish all exposed ports to random host ports"
                data-cy="publish-all-ports-switch"
                tooltip="When enabled, Portainer will let Docker automatically map a random port on the host to each one defined in the image Dockerfile."
                checked={values.publishAllPorts}
                onChange={(publishAllPorts) =>
                  setFieldValue('publishAllPorts', publishAllPorts)
                }
                labelClass="col-sm-3 col-lg-2"
              />
            </div>
          </div>

          <PortsMappingField
            value={values.ports}
            onChange={(ports) => setFieldValue('ports', ports)}
            errors={errors?.ports}
          />
        </FormSection>

        {isAgentOnSwarm && (
          <FormSection title="Deployment">
            <NodeSelector
              value={values.nodeName}
              onChange={(nodeName) => setFieldValue('nodeName', nodeName)}
            />
          </FormSection>
        )}

        <AccessControlForm
          onChange={(accessControl) =>
            setFieldValue('accessControl', accessControl)
          }
          errors={errors?.accessControl}
          values={values.accessControl}
          environmentId={environment.Id}
        />

        <div className="form-group">
          <div className="col-sm-12">
            <SwitchField
              label="Auto remove"
              data-cy="container-auto-remove-switch"
              tooltip="When enabled, Portainer will automatically remove the container when it exits. This is useful when you want to use the container only once."
              checked={values.autoRemove}
              onChange={(autoRemove) => setFieldValue('autoRemove', autoRemove)}
              labelClass="col-sm-3 col-lg-2"
            />
          </div>
        </div>

        <div className="form-group">
          <div className="col-sm-12">
            <LoadingButton
              loadingText="Deployment in progress..."
              data-cy="deploy-container-button"
              isLoading={isLoading}
              disabled={!isValid}
            >
              Deploy the container
            </LoadingButton>
          </div>
        </div>
      </Widget.Body>
    </Widget>
  );
}
