import { FormikErrors } from 'formik';
import { SetStateAction } from 'react';

import { RelativePathFieldset } from '@/react/portainer/gitops/RelativePathFieldset/RelativePathFieldset';
import { PrivateRegistryFieldsetWrapper } from '@/react/edge/edge-stacks/ItemView/EditEdgeStackForm/PrivateRegistryFieldsetWrapper';
import { PrePullToggle } from '@/react/edge/edge-stacks/components/PrePullToggle';
import { RetryDeployToggle } from '@/react/edge/edge-stacks/components/RetryDeployToggle';
import { EdgeTemplateSettings } from '@/react/portainer/templates/custom-templates/types';
import { GitFormModel } from '@/react/portainer/gitops/types';

import { FormSection } from '@@/form-components/FormSection';

export function EdgeSettingsFieldset({
  values,
  setValues,
  errors,
  gitConfig,
  fileValues,
  setFieldError,
}: {
  values: EdgeTemplateSettings;
  setValues: (values: SetStateAction<EdgeTemplateSettings>) => void;
  errors?: FormikErrors<EdgeTemplateSettings>;
  gitConfig?: GitFormModel;
  setFieldError: (field: string, message: string) => void;
  fileValues: {
    fileContent?: string;
    file?: File;
  };
}) {
  const isGit = !!gitConfig;
  return (
    <>
      {isGit && (
        <FormSection title="Advanced settings">
          <RelativePathFieldset
            values={values.RelativePathSettings}
            gitModel={gitConfig}
            onChange={(newValues) =>
              setValues((values) => ({
                ...values,
                RelativePathSettings: {
                  ...values.RelativePathSettings,
                  ...newValues,
                },
              }))
            }
          />
        </FormSection>
      )}

      <PrivateRegistryFieldsetWrapper
        value={values.PrivateRegistryId}
        onChange={(registryId) =>
          setValues((values) => ({
            ...values,
            PrivateRegistryId: registryId,
          }))
        }
        values={fileValues}
        onFieldError={(error) => setFieldError('Edge?.Registries', error)}
        error={errors?.PrivateRegistryId}
        isGit={isGit}
      />

      <PrePullToggle
        onChange={(value) =>
          setValues((values) => ({ ...values, PrePullImage: value }))
        }
        value={values.PrePullImage}
      />

      <RetryDeployToggle
        onChange={(value) =>
          setValues((values) => ({ ...values, RetryDeploy: value }))
        }
        value={values.RetryDeploy}
      />
    </>
  );
}
