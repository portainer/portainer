import { useCallback } from 'react';

import { GitFormModel } from '@/react/portainer/gitops/types';
import { PathSelector } from '@/react/portainer/gitops/ComposePathField/PathSelector';
import { dummyGitForm } from '@/react/portainer/gitops/RelativePathFieldset/utils';
import { useValidation } from '@/react/portainer/gitops/RelativePathFieldset/useValidation';

import { SwitchField } from '@@/form-components/SwitchField';
import { TextTip } from '@@/Tip/TextTip';
import { FormControl } from '@@/form-components/FormControl';
import { Input, Select } from '@@/form-components/Input';

import { RelativePathModel, getPerDevConfigsFilterType } from './types';

interface Props {
  value: RelativePathModel;
  gitModel?: GitFormModel;
  onChange?: (value: Partial<RelativePathModel>) => void;
  readonly?: boolean;
}

export function RelativePathFieldset({
  value,
  gitModel,
  onChange,
  readonly,
}: Props) {
  const innerOnChange = useCallback(
    (value: Partial<RelativePathModel>) => onChange && onChange(value),
    [onChange]
  );

  const { errors } = useValidation(value);

  return (
    <>
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            name="EnableRelativePaths"
            label="Enable relative path volumes"
            labelClass="col-sm-3 col-lg-2"
            tooltip="Enabling this means you can specify relative path volumes in your Compose files, with Portainer pulling the content from your git repository to the environment the stack is deployed to."
            disabled={readonly}
            checked={value.SupportRelativePath}
            onChange={(value) => innerOnChange({ SupportRelativePath: value })}
          />
        </div>
      </div>

      {value.SupportRelativePath && (
        <>
          <div className="form-group">
            <div className="col-sm-12">
              <TextTip color="blue">
                For relative path volumes use with Docker Swarm, you must have a
                network filesystem which all of your nodes can access.
              </TextTip>
            </div>
          </div>

          <div className="form-group">
            <div className="col-sm-12">
              <FormControl
                label="Local filesystem path"
                errors={errors.FilesystemPath}
              >
                <Input
                  name="FilesystemPath"
                  placeholder="/mnt"
                  disabled={readonly}
                  value={value.FilesystemPath}
                  onChange={(e) =>
                    innerOnChange({ FilesystemPath: e.target.value })
                  }
                />
              </FormControl>
            </div>
          </div>

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
                label="GitOps Edge configurations"
                labelClass="col-sm-3 col-lg-2"
                tooltip="By enabling the GitOps Edge Configurations feature, you gain the ability to define relative path volumes in your configuration files. Portainer will then automatically fetch the content from your git repository by matching the folder name or file name with the Portainer Edge ID, and apply it to the environment where the stack is deployed"
                disabled={readonly}
                checked={!!value.SupportPerDeviceConfigs}
                onChange={(value) =>
                  innerOnChange({ SupportPerDeviceConfigs: value })
                }
              />
            </div>
          </div>

          {value.SupportPerDeviceConfigs && (
            <>
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
                    errors={errors.PerDeviceConfigsPath}
                  >
                    <PathSelector
                      value={value.PerDeviceConfigsPath || ''}
                      onChange={(value) =>
                        innerOnChange({ PerDeviceConfigsPath: value })
                      }
                      placeholder="config"
                      model={gitModel || dummyGitForm}
                      readOnly={readonly}
                      dirOnly
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
                      onChange={(e) =>
                        innerOnChange({
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
                      disabled={readonly}
                    />
                  </FormControl>
                </div>
              </div>

              <div className="form-group">
                <div className="col-sm-12">
                  <FormControl label="Group matching rule">
                    <Select
                      value={value.PerDeviceConfigsGroupMatchType}
                      onChange={(e) =>
                        innerOnChange({
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
                      disabled={readonly}
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
                      <a href="https://docs.portainer.io/user/edge/stacks/add#gitops-edge-configurations">
                        here
                      </a>
                      .
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
}
