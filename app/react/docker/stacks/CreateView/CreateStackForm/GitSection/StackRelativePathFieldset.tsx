import { Info } from 'lucide-react';
import { Field, useFormikContext } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { SwitchField } from '@@/form-components/SwitchField';
import { Icon } from '@@/Icon';

import { FormValues } from '../types';

interface Props {
  isDockerStandalone: boolean;
}

export function StackRelativePathFieldset({ isDockerStandalone }: Props) {
  const { values, setFieldValue, errors } = useFormikContext<FormValues>();

  const supportRelativePath = values.git.SupportRelativePath || false;

  return (
    <div className="form-group">
      <div className="col-sm-12 mb-3">
        <SwitchField
          label="Enable relative path volumes"
          checked={supportRelativePath}
          onChange={(checked) =>
            setFieldValue('git.SupportRelativePath', checked)
          }
          tooltip="Enabling this means you can specify relative path volumes in your Compose files, with Portainer pulling the content from your git repository to the environment the stack is deployed to."
          labelClass="col-sm-3 col-lg-2"
          data-cy="enable-relative-paths"
        />
      </div>

      {supportRelativePath && (
        <>
          {!isDockerStandalone && (
            <div className="col-sm-12">
              <p className="small text-muted flex items-center gap-1">
                <Icon icon={Info} className="!mr-1 text-blue-8" />
                For relative path volumes use with Docker Swarm, you must have a
                network filesystem which all of your nodes can access.
              </p>
            </div>
          )}

          <div className="col-sm-12">
            <FormControl
              label={
                isDockerStandalone
                  ? 'Local filesystem path'
                  : 'Network filesystem path'
              }
              inputId="filesystem-path"
              size="medium"
              errors={errors.git?.FilesystemPath}
            >
              <Field
                as={Input}
                id="filesystem-path"
                name="git.FilesystemPath"
                placeholder="/mnt"
                data-cy="filesystem-path"
              />
            </FormControl>
          </div>
        </>
      )}
    </div>
  );
}
