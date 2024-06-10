import { Form, Formik } from 'formik';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';

import { EdgeCheckinIntervalField } from '@/react/edge/components/EdgeCheckInIntervalField';
import { EdgeAsyncIntervalsForm } from '@/react/edge/components/EdgeAsyncIntervalsForm';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { notifySuccess } from '@/portainer/services/notifications';

import { Widget } from '@@/Widget';
import { FormSection } from '@@/form-components/FormSection';
import { TLSFieldset } from '@@/TLSFieldset';
import { TextTip } from '@@/Tip/TextTip';

import { Environment, EnvironmentStatus, EnvironmentType } from '../../types';
import { NameField } from '../../common/NameField';
import {
  isAgentEnvironment,
  isDockerAPIEnvironment,
  isDockerEnvironment,
  isEdgeEnvironment,
  isLocalEnvironment,
} from '../../utils';
import { MetadataFieldset } from '../../common/MetadataFieldset';

import { URLField } from './URLField';
import { PublicIPField } from './PublicIPField';
import { FormValues } from './types';
import { useUpdateMutation } from './useUpdateMutation';
import { AgentAddressField } from './AgentEnvironmentAddress';
import { AmtInfo } from './AMTInfo';
import { EnvironmentFormActions } from './EnvironmentFormActions';
import { AzureForm } from './AzureForm';

export function UpdateForm({ environment }: { environment: Environment }) {
  const isEdge = isEdgeEnvironment(environment.Type);
  const isAgent = isAgentEnvironment(environment.Type);
  const isLocal = isLocalEnvironment(environment);

  const { isLoading, handleSubmit } = useUpdateMutation(environment, {
    isEdge,
    isLocal,
  });

  const isAmtVisible =
    isDockerEnvironment(environment.Type) && isEdge && !!environment.EdgeID;
  const isErrorState = environment.Status === EnvironmentStatus.Error;
  const initialValues: FormValues = {
    name: environment.Name,
    url: environment.URL,
    publicUrl: environment.PublicURL || '',

    tlsConfig: {
      tls: environment.TLSConfig.TLS || false,
      skipVerify: environment.TLSConfig.TLSSkipVerify || false,
    },
    meta: {
      tagIds: environment.TagIds,
      groupId: environment.GroupId,
    },

    edge: {
      checkInInterval: environment.EdgeCheckinInterval || 0,
      CommandInterval: environment.Edge.CommandInterval || 0,
      PingInterval: environment.Edge.PingInterval || 0,
      SnapshotInterval: environment.Edge.SnapshotInterval || 0,
    },
  };

  const router = useRouter();
  const {
    params: { redirectTo },
  } = useCurrentStateAndParams();

  if (environment.Type === EnvironmentType.Azure) {
    return (
      <AzureForm
        environment={environment}
        onSuccessUpdate={(name) => {
          notifySuccess('Environment updated', name);
          router.stateService.go(redirectTo || '^');
        }}
      />
    );
  }

  return (
    <Widget>
      <Widget.Body>
        <Formik initialValues={initialValues} onSubmit={handleSubmit}>
          {({ values, errors, setFieldValue, setValues, isValid }) => (
            <Form className="form-horizontal">
              <FormSection title="Configuration">
                <NameField disabled={isErrorState} />
                {!isErrorState && (
                  <>
                    {!isEdge &&
                      (isAgent ? (
                        <AgentAddressField />
                      ) : (
                        <URLField
                          disabled={isLocal}
                          value={values.url}
                          onChange={(value) => setFieldValue('url', value)}
                          error={errors.url}
                        />
                      ))}
                    <PublicIPField />

                    {isEdge && isBE && (
                      <TextTip color="blue">
                        Use https connection on Edge agent to use private
                        registries with credentials.
                      </TextTip>
                    )}
                  </>
                )}
              </FormSection>
              {isEdge && (
                <FormSection title="Check-in Intervals">
                  {environment.Edge.AsyncMode ? (
                    <EdgeAsyncIntervalsForm
                      values={values.edge}
                      onChange={(value) =>
                        setValues((values) => ({
                          ...values,
                          edge: { ...values.edge, ...value },
                        }))
                      }
                    />
                  ) : (
                    <EdgeCheckinIntervalField
                      value={values.edge.checkInInterval || 0}
                      onChange={(value) =>
                        setFieldValue('edge.checkInInterval', value)
                      }
                    />
                  )}
                </FormSection>
              )}
              {!isEdge &&
                environment.Status !== EnvironmentStatus.Error &&
                isDockerAPIEnvironment(environment) && (
                  <TLSFieldset
                    errors={errors.tlsConfig}
                    values={values.tlsConfig}
                    onChange={(tlsConfig) =>
                      setValues((values) => ({
                        ...values,
                        tlsConfig: { ...values.tlsConfig, ...tlsConfig },
                      }))
                    }
                  />
                )}

              <MetadataFieldset />
              {isAmtVisible && <AmtInfo environmentId={environment.Id} />}
              <EnvironmentFormActions isLoading={isLoading} isValid={isValid} />
            </Form>
          )}
        </Formik>
      </Widget.Body>
    </Widget>
  );
}
