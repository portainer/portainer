import { useState } from 'react';
import { FormikErrors } from 'formik';

import {
  PathSelector,
  PathSelectorGitModel,
} from '@/react/portainer/gitops/ComposePathField/PathSelector';
import { dummyGitForm } from '@/react/portainer/gitops/RelativePathFieldset/utils';

import { SwitchField } from '@@/form-components/SwitchField';
import { TextTip } from '@@/Tip/TextTip';
import { FormControl } from '@@/form-components/FormControl';
import { Input, Select } from '@@/form-components/Input';
import { useDocsUrl } from '@@/PageHeader/ContextHelp';
import { InsightsBox } from '@@/InsightsBox';

import { RelativePathModel, getPerDevConfigsFilterType } from './types';

interface Props {
  values: RelativePathModel;
  gitModel?: PathSelectorGitModel;
  onChange: (value: RelativePathModel) => void;
  isEditing?: boolean;
  hideEdgeConfigs?: boolean;
  errors?: FormikErrors<RelativePathModel>;
}

export function RelativePathFieldset({
  values: value,
  gitModel,
  onChange = () => {},
  isEditing,
  hideEdgeConfigs,
  errors,
}: Props) {
  const [relativePathManuallyEnabled, setRelativePathManuallyEnabled] =
    useState(value.SupportRelativePath);

  const [relativePathForcedEnabled, setRelativePathForcedEnabled] = useState(
    value.SupportPerDeviceConfigs
  );

  const gitoptsEdgeConfigDocUrl = useDocsUrl(
    '/user/edge/stacks/add#gitops-edge-configurations'
  );

  const pathTipSwarm =
    'For relative path volumes use with Docker Swarm, you must have a network filesystem which all of your nodes can access.';
  const pathTipGitopsActive =
    'GitOps Edge configurations is active. When you set the ‘local filesystem path’, it will also be utilized for relative paths.';

  return (
    <>
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            name="EnableRelativePaths"
            data-cy="gitops-enable-relative-paths-switch"
            label="Enable relative path volumes"
            labelClass="col-sm-3 col-lg-2"
            tooltip="Enabling this means you can specify relative path volumes in your Compose files, with Portainer pulling the content from your git repository to the environment the stack is deployed to."
            disabled={isEditing || relativePathForcedEnabled}
            checked={value.SupportRelativePath}
            onChange={(value) => {
              setRelativePathManuallyEnabled(value);
              handleChange({ SupportRelativePath: value });
            }}
          />
        </div>
      </div>

      {value.SupportRelativePath && (
        <>
          <div className="form-group">
            <div className="col-sm-12">
              <TextTip color="blue">
                {relativePathForcedEnabled ? pathTipGitopsActive : pathTipSwarm}
              </TextTip>
            </div>
          </div>

          {(!relativePathForcedEnabled || hideEdgeConfigs) && (
            <div className="form-group">
              <div className="col-sm-12">
                <FormControl
                  label="Local filesystem path"
                  errors={errors?.FilesystemPath}
                  required
                >
                  <Input
                    name="FilesystemPath"
                    data-cy="relative-path-filesystem-path-input"
                    placeholder="/mnt"
                    disabled={isEditing}
                    value={value.FilesystemPath}
                    onChange={(e) =>
                      handleChange({ FilesystemPath: e.target.value })
                    }
                  />
                </FormControl>
              </div>
            </div>
          )}
        </>
      )}

      {!hideEdgeConfigs && (
        <>
          <div className="form-group">
            <div className="col-sm-12">
              <TextTip color="blue">
                When enabled, corresponding Edge ID will be passed through as an
                environment variable: PORTAINER_EDGE_ID.
              </TextTip>
            </div>
          </div>

          <div className="form-group">
            <div className="col-sm-12">
              <SwitchField
                name="EnablePerDeviceConfigs"
                data-cy="gitops-enable-per-device-configs-switch"
                label="GitOps Edge configurations"
                labelClass="col-sm-3 col-lg-2"
                tooltip="By enabling the GitOps Edge Configurations feature, you gain the ability to define relative path volumes in your configuration files. Portainer will then automatically fetch the content from your git repository by matching the folder name or file name with the Portainer Edge ID, and apply it to the environment where the stack is deployed"
                disabled={isEditing}
                checked={!!value.SupportPerDeviceConfigs}
                onChange={(v) => {
                  setRelativePathForcedEnabled(v);
                  handleChange({
                    SupportPerDeviceConfigs: v,
                    SupportRelativePath: v ? true : relativePathManuallyEnabled,
                  });
                }}
              />
            </div>
          </div>

          {value.SupportPerDeviceConfigs && (
            <>
              <InsightsBox
                content={
                  <p>
                    Files named <code>$&#123;PORTAINER_EDGE_ID&#125;.env</code>{' '}
                    and/or <code>$&#123;PORTAINER_EDGE_GROUP&#125;.env</code>{' '}
                    contained by the config folder will be loaded for compose
                    file interpolation.
                  </p>
                }
                header="GitOps Edge Configurations"
                insightCloseId="edge-config-interpolation-info"
                className="mb-3"
              />

              <div className="form-group">
                <div className="col-sm-12">
                  <TextTip color="blue">{pathTipSwarm}</TextTip>
                </div>
              </div>

              <div className="form-group">
                <div className="col-sm-12">
                  <FormControl
                    label="Local filesystem path"
                    errors={errors?.FilesystemPath}
                    required
                  >
                    <Input
                      name="FilesystemPath"
                      data-cy="per-device-configs-filesystem-path-input"
                      placeholder="/mnt"
                      disabled={isEditing}
                      value={value.FilesystemPath}
                      onChange={(e) =>
                        handleChange({ FilesystemPath: e.target.value })
                      }
                    />
                  </FormControl>
                </div>
              </div>

              <div className="form-group">
                <div className="col-sm-12">
                  <TextTip color="blue">
                    Specify the directory name where your configuration will be
                    located. This will allow you to manage device configuration
                    settings with a Git repo as your template.
                  </TextTip>
                </div>
              </div>

              <div className="form-group">
                <div className="col-sm-12">
                  <FormControl
                    label="Directory"
                    errors={errors?.PerDeviceConfigsPath}
                    inputId="per_device_configs_path_input"
                    required
                  >
                    <PathSelector
                      value={value.PerDeviceConfigsPath || ''}
                      onChange={(value) =>
                        handleChange({ PerDeviceConfigsPath: value })
                      }
                      placeholder="config"
                      model={gitModel || dummyGitForm}
                      readOnly={isEditing}
                      dirOnly
                      inputId="per_device_configs_path_input"
                    />
                  </FormControl>
                </div>
              </div>

              <div className="form-group">
                <div className="col-sm-12">
                  <TextTip color="blue">
                    Select which rule to use when matching configuration with
                    Portainer Edge ID either on a per-device basis or group-wide
                    with an Edge Group. Only configurations that match the
                    selected rule will be accessible through their corresponding
                    paths. Deployments that rely on accessing the configuration
                    may experience errors.
                  </TextTip>
                </div>
              </div>

              <div className="form-group">
                <div className="col-sm-12">
                  <FormControl label="Device matching rule">
                    <Select
                      value={value.PerDeviceConfigsMatchType}
                      data-cy="per-device-configs-match-type-select"
                      onChange={(e) =>
                        handleChange({
                          PerDeviceConfigsMatchType: getPerDevConfigsFilterType(
                            e.target.value
                          ),
                        })
                      }
                      options={[
                        {
                          label: '',
                          value: '',
                        },
                        {
                          label: 'Match file name with Portainer Edge ID',
                          value: 'file',
                        },
                        {
                          label: 'Match folder name with Portainer Edge ID',
                          value: 'dir',
                        },
                      ]}
                      disabled={isEditing}
                    />
                  </FormControl>
                </div>
              </div>

              <div className="form-group">
                <div className="col-sm-12">
                  <FormControl label="Group matching rule">
                    <Select
                      value={value.PerDeviceConfigsGroupMatchType}
                      data-cy="per-device-configs-group-match-type-select"
                      onChange={(e) =>
                        handleChange({
                          PerDeviceConfigsGroupMatchType:
                            getPerDevConfigsFilterType(e.target.value),
                        })
                      }
                      options={[
                        {
                          label: '',
                          value: '',
                        },
                        {
                          label: 'Match file name with Edge Group',
                          value: 'file',
                        },
                        {
                          label: 'Match folder name with Edge Group',
                          value: 'dir',
                        },
                      ]}
                      disabled={isEditing}
                    />
                  </FormControl>
                </div>
              </div>

              <div className="form-group">
                <div className="col-sm-12">
                  <TextTip color="blue">
                    <div>
                      You can use it as an environment variable with an image:{' '}
                      <code>myapp:$&#123;PORTAINER_EDGE_ID&#125;</code> or{' '}
                      <code>myapp:$&#123;PORTAINER_EDGE_GROUP&#125;</code>. You
                      can also use it with the relative path for volumes:{' '}
                      <code>
                        ./config/$&#123;PORTAINER_EDGE_ID&#125;:/myapp/config
                      </code>{' '}
                      or{' '}
                      <code>
                        ./config/$&#123;PORTAINER_EDGE_GROUP&#125;:/myapp/groupconfig
                      </code>
                      . More documentation can be found{' '}
                      <a href={gitoptsEdgeConfigDocUrl}>here</a>.
                    </div>
                  </TextTip>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );

  function handleChange(newValue: Partial<RelativePathModel>) {
    onChange({ ...value, ...newValue });
  }
}
