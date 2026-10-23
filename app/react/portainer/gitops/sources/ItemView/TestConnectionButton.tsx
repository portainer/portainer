import { ArrowLeftRight, CheckCircle, XCircle } from 'lucide-react';

import { LoadingButton } from '@@/buttons';
import { Icon } from '@@/Icon';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';

import { Source } from '../types';
import {
  ConnectionTestResult,
  useTestSourceConnectionMutation,
} from '../queries/useTestSourceConnectionMutation';
import { UpdateSourcePayload } from '../queries/useUpdateSourceMutation';

interface Props {
  sourceId: Source['id'];
  payload?: UpdateSourcePayload;
  'data-cy': string;
  showError?: boolean;
}

export function TestConnectionButton({
  sourceId,
  payload,
  'data-cy': dataCy,
  showError,
}: Props) {
  const mutation = useTestSourceConnectionMutation();

  return (
    <div className="flex items-center gap-2">
      <LoadingButton
        size="small"
        color="default"
        className="!ml-0"
        isLoading={mutation.isLoading}
        icon={ArrowLeftRight}
        loadingText="Testing connection..."
        onClick={() => mutation.mutate({ id: sourceId, payload })}
        type="button"
        data-cy={dataCy}
      >
        Test connection
      </LoadingButton>
      {mutation.isSuccess && (
        <ConnectionTestStatusIcon
          result={mutation.data}
          showError={showError}
        />
      )}
    </div>
  );
}

function ConnectionTestStatusIcon({
  result,
  showError,
}: {
  result: ConnectionTestResult;
  showError?: boolean;
}) {
  if (result.success) {
    return (
      <>
        <Icon icon={CheckCircle} mode="success" />
        <span className="sr-only">Connection successful</span>
      </>
    );
  }

  const errorMessage = result.error ?? 'Connection failed';

  if (showError) {
    return (
      <span
        className="flex items-center gap-1 text-sm text-error-9 th-highcontrast:text-error-4 th-dark:text-error-4"
        role="alert"
      >
        <Icon icon={XCircle} mode="danger" />
        {errorMessage}
      </span>
    );
  }

  return (
    <TooltipWithChildren message={errorMessage}>
      <span role="alert">
        <Icon icon={XCircle} mode="danger" />
        <span className="sr-only">{errorMessage}</span>
      </span>
    </TooltipWithChildren>
  );
}
