import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeftRight, CheckCircle } from 'lucide-react';

import { LoadingButton } from '@@/buttons';
import { TextTip } from '@@/Tip/TextTip';

import { RegistryTypes } from '../../types/registry';

import { useCheckRegistryConnectionMutation } from './useCheckRegistryConnectionMutation';

interface Props {
  values: {
    Username: string;
    Password: string;
  };
  onTestSuccess: () => void;
  disabled?: boolean;
  isConnectionTested?: boolean;
}

export function RegistryTestConnection({
  values,
  onTestSuccess,
  isConnectionTested,
  disabled,
}: Props) {
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!isConnectionTested) {
      setTestResult({
        success: false,
        message: 'Connection not tested yet.',
      });
    }
  }, [isConnectionTested]);

  const pingMutation = useCheckRegistryConnectionMutation();

  return (
    <div className="flex flex-row items-center gap-3">
      <LoadingButton
        size="small"
        color="default"
        className="!ml-0 w-min"
        isLoading={pingMutation.isLoading}
        icon={ArrowLeftRight}
        loadingText="Testing connection..."
        onClick={handleTestConnection}
        disabled={disabled || !values.Username || !values.Password}
        type="button"
        data-cy="registry-test-connection-button"
      >
        Test connection
      </LoadingButton>

      {testResult && (
        <TextTip
          className="!items-start [&>svg]:mt-0.5"
          icon={testResult.success ? CheckCircle : AlertCircle}
          color={testResult.success ? 'green' : 'red'}
        >
          {testResult.message}
        </TextTip>
      )}
    </div>
  );

  async function handleTestConnection() {
    if (!values.Username || !values.Password) {
      setTestResult({
        success: false,
        message:
          'Please fill in all required fields before testing the connection.',
      });
      return;
    }

    setTestResult(null);

    const testPayload = {
      Username: values.Username,
      Password: values.Password,
      Type: RegistryTypes.DOCKERHUB, // DockerHub registry type
    };

    pingMutation.mutate(testPayload, {
      onSuccess(response) {
        if (response.success) {
          setTestResult({
            success: true,
            message:
              response.message ||
              'Registry connection successful! You can now save the registry.',
          });
          onTestSuccess();
        } else {
          setTestResult({
            success: false,
            message:
              response.message ||
              'Failed to connect to the registry. Please check your credentials.',
          });
        }
      },
      onError() {
        setTestResult({
          success: false,
          message:
            'Failed to test registry connection. Please try again later.',
        });
      },
    });
  }
}
