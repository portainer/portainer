import { Form, Formik } from 'formik';

import { EdgeCheckinIntervalField } from '@/react/edge/components/EdgeCheckInIntervalField';
import { EdgeAsyncIntervalsForm } from '@/react/edge/components/EdgeAsyncIntervalsForm';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { Widget } from '@@/Widget';
import { FormSection } from '@@/form-components/FormSection';
import { TLSFieldset } from '@@/TLSFieldset';
import { FormActions } from '@@/form-components/FormActions';
import { Button } from '@@/buttons';
import { Link } from '@@/Link';
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

import { AzureEnvironmentConfiguration } from './AzureConfiguration';
import { URLField } from './URLField';
import { PublicIPField } from './PublicIPField';
import { FormValues } from './types';
import { useUpdateMutation } from './useUpdateMutation';
import { AgentAddressField } from './AgentEnvironmentAddress';
import { AmtInfo } from './AMTInfo';

export function UpdateForm({ environment }: { environment: Environment }) {
  const isEdge = isEdgeEnvironment(environment.Type);
  const isAgent = isAgentEnvironment(environment.Type);
  const isLocal = isLocalEnvironment(environment);
  const isAzure = environment.Type === EnvironmentType.Azure;
  const { isLoading, handleSubmit } = useUpdateMutation(environment, {
    isEdge,
    isLocal,
    isAzure,
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
    azure: {
      applicationId: environment.AzureCredentials?.ApplicationID || '',
      tenantId: environment.AzureCredentials?.TenantID || '',
      authKey: environment.AzureCredentials?.AuthenticationKey || '',
    },
    edge: {
      checkInInterval: environment.EdgeCheckinInterval || 0,
      CommandInterval: environment.Edge.CommandInterval || 0,
      PingInterval: environment.Edge.PingInterval || 0,
      SnapshotInterval: environment.Edge.SnapshotInterval || 0,
    },
  };

  return (
    <div className="row">
      <div className="col-sm-12">
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
                            <URLField disabled={isAzure || isLocal} />
                          ))}
                        {!isAzure && <PublicIPField />}

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
                  {isAzure && (
                    <AzureEnvironmentConfiguration
                      errors={errors.azure}
                      setFieldValue={(field, value) =>
                        setFieldValue(`azure.${field}`, value)
                      }
                      values={values.azure}
                    />
                  )}
                  <MetadataFieldset />
                  {isAmtVisible && <AmtInfo environmentId={environment.Id} />}
                  <FormActions
                    isLoading={isLoading}
                    isValid={isValid}
                    loadingText="Updating environment..."
                    submitLabel="Update environment"
                    data-cy="update-environment-button"
                  >
                    <Button
                      as={Link}
                      props={{
                        to: '^',
                        'data-cy': 'cancel-update-environment-button',
                      }}
                      color="default"
                      data-cy="cancel-update-environment-button"
                    >
                      Cancel
                    </Button>
                  </FormActions>
                </Form>
              )}
            </Formik>
          </Widget.Body>
        </Widget>
      </div>
    </div>
  );
}
