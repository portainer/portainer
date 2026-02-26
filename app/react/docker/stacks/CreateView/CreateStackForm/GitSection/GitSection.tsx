import { useFormikContext } from 'formik';

import { GitForm } from '@/react/portainer/gitops/GitForm';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { baseStackWebhookUrl } from '@/portainer/helpers/webhookHelper';

import { FormValues } from '../types';

import { StackRelativePathFieldset } from './StackRelativePathFieldset';

interface Props {
  isDockerStandalone?: boolean;
  webhookId: string;
}

export function GitSection({ webhookId, isDockerStandalone = false }: Props) {
  const { values, errors, setValues } = useFormikContext<FormValues>();

  return (
    <>
      <GitForm
        value={values.git}
        onChange={(gitValues) =>
          setValues((values) => ({
            ...values,
            git: {
              ...values.git,
              ...gitValues,
            },
          }))
        }
        environmentType="DOCKER"
        deployMethod="compose"
        isDockerStandalone={isDockerStandalone}
        isAdditionalFilesFieldVisible
        isAuthExplanationVisible
        isForcePullVisible
        errors={errors.git}
        baseWebhookUrl={baseStackWebhookUrl()}
        webhookId={webhookId}
      />
      {isBE && (
        <StackRelativePathFieldset isDockerStandalone={isDockerStandalone} />
      )}
    </>
  );
}
