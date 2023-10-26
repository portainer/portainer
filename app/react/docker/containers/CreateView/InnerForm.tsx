import { useFormikContext, Form } from 'formik';
import { Settings } from 'lucide-react';
import { useState } from 'react';

import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useIsEnvironmentAdmin } from '@/react/hooks/useUser';

import { NavTabs } from '@@/NavTabs';
import { Widget } from '@@/Widget';

import { useApiVersion } from '../../proxy/queries/useVersion';

import { BaseForm } from './BaseForm';
import { CapabilitiesTab } from './CapabilitiesTab';
import { CommandsTab } from './CommandsTab';
import { LabelsTab } from './LabelsTab';
import { NetworkTab } from './NetworkTab';
import { ResourcesTab } from './ResourcesTab';
import { RestartPolicyTab } from './RestartPolicyTab';
import { VolumesTab } from './VolumesTab';
import { Values } from './useInitialValues';
import { EnvVarsTab } from './EnvVarsTab';
import { EditResourcesForm } from './ResourcesTab/EditResourceForm';

export function InnerForm({
  hideCapabilities = false,
  isLoading,
  isDuplicate,
  onChangeName,
  onRateLimit,
}: {
  hideCapabilities: boolean;
  isDuplicate: boolean;
  isLoading: boolean;
  onChangeName: (value: string) => void;
  onRateLimit: (limited?: boolean) => void;
}) {
  const { values, setFieldValue, errors, submitForm } =
    useFormikContext<Values>();
  const environmentId = useEnvironmentId();
  const [tab, setTab] = useState('commands');
  const apiVersion = useApiVersion(environmentId);
  const isEnvironmentAdmin = useIsEnvironmentAdmin();
  const envQuery = useCurrentEnvironment();

  if (!envQuery.data) {
    return null;
  }

  const environment = envQuery.data;

  return (
    <Form className="form-horizontal">
      <div className="row">
        <div className="col-sm-12">
          <div>
            <BaseForm
              onChangeName={onChangeName}
              onChangeImageName={() => {
                setFieldValue('commands.cmd', null);
                setFieldValue('commands.entrypoint', null);
              }}
              isLoading={isLoading}
              onRateLimit={onRateLimit}
            />

            <div className="mt-4">
              <Widget>
                <Widget.Title
                  title="Advanced container settings"
                  icon={Settings}
                />
                <Widget.Body>
                  <NavTabs<string>
                    onSelect={setTab}
                    selectedId={tab}
                    type="pills"
                    justified
                    options={[
                      {
                        id: 'commands',
                        label: 'Commands & logging',
                        children: (
                          <CommandsTab
                            apiVersion={apiVersion}
                            values={values.commands}
                            setFieldValue={(field, value) =>
                              setFieldValue(`commands.${field}`, value)
                            }
                          />
                        ),
                      },
                      {
                        id: 'volumes',
                        label: 'Volumes',
                        children: (
                          <VolumesTab
                            values={values.volumes}
                            onChange={(value) =>
                              setFieldValue('volumes', value)
                            }
                            errors={errors.volumes}
                            allowBindMounts={
                              isEnvironmentAdmin ||
                              environment.SecuritySettings
                                .allowBindMountsForRegularUsers
                            }
                          />
                        ),
                      },
                      {
                        id: 'network',
                        label: 'Network',
                        children: (
                          <NetworkTab
                            values={values.network}
                            setFieldValue={(field, value) =>
                              setFieldValue(`network.${field}`, value)
                            }
                          />
                        ),
                      },
                      {
                        id: 'env',
                        label: 'Env',
                        children: (
                          <EnvVarsTab
                            values={values.env}
                            onChange={(value) => setFieldValue('env', value)}
                            errors={errors.env}
                          />
                        ),
                      },
                      {
                        id: 'labels',
                        label: 'Labels',
                        children: (
                          <LabelsTab
                            values={values.labels}
                            onChange={(value) => setFieldValue('labels', value)}
                            errors={errors.labels}
                          />
                        ),
                      },
                      {
                        id: 'restart',
                        label: 'Restart policy',
                        children: (
                          <RestartPolicyTab
                            values={values.restartPolicy}
                            onChange={(value) =>
                              setFieldValue('restartPolicy', value)
                            }
                          />
                        ),
                      },
                      {
                        id: 'runtime',
                        label: 'Runtime & resources',
                        children: (
                          <ResourcesTab
                            values={values.resources}
                            errors={errors.resources}
                            setFieldValue={(field, value) =>
                              setFieldValue(`resources.${field}`, value)
                            }
                            allowPrivilegedMode={
                              isEnvironmentAdmin ||
                              environment.SecuritySettings
                                .allowPrivilegedModeForRegularUsers
                            }
                            isDevicesFieldVisible={
                              isEnvironmentAdmin ||
                              environment.SecuritySettings
                                .allowDeviceMappingForRegularUsers
                            }
                            isInitFieldVisible={apiVersion >= 1.37}
                            isSysctlFieldVisible={
                              isEnvironmentAdmin ||
                              environment.SecuritySettings
                                .allowSysctlSettingForRegularUsers
                            }
                            renderLimits={
                              isDuplicate
                                ? (values) => (
                                    <EditResourcesForm
                                      initialValues={values}
                                      redeploy={(values) => {
                                        setFieldValue(
                                          'resources.resources',
                                          values
                                        );
                                        return submitForm();
                                      }}
                                      isImageInvalid={!!errors?.image}
                                    />
                                  )
                                : undefined
                            }
                          />
                        ),
                      },
                      {
                        id: 'capabilities',
                        label: 'Capabilities',
                        hidden: hideCapabilities,
                        children: (
                          <CapabilitiesTab
                            values={values.capabilities}
                            onChange={(value) =>
                              setFieldValue('capabilities', value)
                            }
                          />
                        ),
                      },
                    ]}
                  />
                </Widget.Body>
              </Widget>
            </div>
          </div>
        </div>
      </div>
    </Form>
  );
}
