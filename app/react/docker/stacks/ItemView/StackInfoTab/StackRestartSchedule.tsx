import { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';

import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { Stack } from '@/react/common/stacks/types';
import { useUpdateRestartScheduleMutation } from '@/react/common/stacks/queries/useUpdateRestartScheduleMutation';
import { useSystemStatus } from '@/react/portainer/system/useSystemStatus';

import { TextTip } from '@@/Tip/TextTip';
import { LoadingButton } from '@@/buttons';
import { TableContainer, TableTitle } from '@@/datatables';
import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { SwitchField } from '@@/form-components/SwitchField';

const cronRulePattern =
  /^(\*(\/[1-9][0-9]*)?|([0-5]?[0-9]|6[0-9]|7[0-9])(-[0-5]?[0-9])?)(\s+(\*(\/[1-9][0-9]*)?|([0-5]?[0-9]|6[0-9]|7[0-9])(-[0-5]?[0-9])?)){4}$/;

export function StackRestartSchedule({ stack }: { stack: Stack }) {
  const updateRestartScheduleMutation = useUpdateRestartScheduleMutation(stack.Id);
  const systemStatusQuery = useSystemStatus();
  const [cronExpression, setCronExpression] = useState(
    stack.RestartSchedule?.CronExpression || ''
  );
  const [pullImages, setPullImages] = useState(
    stack.RestartSchedule?.PullImages ?? false
  );
  const [error, setError] = useState<string>();

  useEffect(() => {
    setCronExpression(stack.RestartSchedule?.CronExpression || '');
    setPullImages(stack.RestartSchedule?.PullImages ?? false);
    setError(undefined);
  }, [
    stack.Id,
    stack.RestartSchedule?.CronExpression,
    stack.RestartSchedule?.PullImages,
  ]);

  const hasSchedule = !!stack.RestartSchedule?.CronExpression;
  const currentServerTime = formatServerTime(systemStatusQuery.data?.CurrentTime);

  return (
    <TableContainer>
      <TableTitle label="Scheduled redeploys" icon={RotateCw} />

      <div className="space-y-3 p-5">
        <TextTip color="blue">
          Redeploy this stack on a cron schedule using the Portainer server
          time. Current server time:<code>{currentServerTime ?? 'Loading...'}</code>.
          Example: <code>0 2 * * *</code> redeploys the stack daily at 2am.
        </TextTip>

        <FormControl
          label="Cron rule"
          inputId="stack-restart-schedule-cron"
          errors={error}
        >
          <Input
            id="stack-restart-schedule-cron"
            name="stack-restart-schedule-cron"
            data-cy="stack-restart-schedule-cron"
            placeholder="e.g. 0 2 * * *"
            value={cronExpression}
            onChange={(e) => {
              setCronExpression(e.target.value);
              if (error) {
                setError(undefined);
              }
            }}
          />
        </FormControl>

        <SwitchField
          checked={pullImages}
          label="Re-pull images before redeploying"
          data-cy="stack-restart-schedule-pull-images"
          onChange={setPullImages}
        />

        <div className="flex items-center gap-2">
          <LoadingButton
            icon={RotateCw}
            isLoading={updateRestartScheduleMutation.isLoading}
            loadingText="Saving..."
            onClick={() => handleSave()}
            data-cy="stack-restart-schedule-save"
          >
            Save schedule
          </LoadingButton>

          {hasSchedule && (
            <LoadingButton
              color="dangerlight"
              isLoading={updateRestartScheduleMutation.isLoading}
              loadingText="Disabling..."
              onClick={() => handleDisable()}
              data-cy="stack-restart-schedule-disable"
            >
              Disable schedule
            </LoadingButton>
          )}
        </div>

        {hasSchedule && (
          <p className="text-xs text-muted">
            Current schedule: <code>{stack.RestartSchedule?.CronExpression}</code>{' '}
            | Re-pull images:{' '}
            {stack.RestartSchedule?.PullImages ? 'Enabled' : 'Disabled'}
          </p>
        )}
      </div>
    </TableContainer>
  );

  function handleSave() {
    const trimmed = cronExpression.trim();
    if (!trimmed) {
      setError('This field is required.');

      return;
    }

    if (!cronRulePattern.test(trimmed)) {
      setError('Please enter a valid 5-field cron rule.');

      return;
    }

    updateRestartScheduleMutation.mutate(
      {
        stackId: stack.Id,
        environmentId: stack.EndpointId,
        restartSchedule: {
          CronExpression: trimmed,
          PullImages: pullImages,
        },
      },
      {
        onError(err) {
          notifyError(
            'Failure',
            err as Error,
            'Unable to update stack redeploy schedule'
          );
        },
        onSuccess() {
          notifySuccess('Success', 'Stack redeploy schedule saved successfully');
        },
      }
    );
  }

  function handleDisable() {
    updateRestartScheduleMutation.mutate(
      {
        stackId: stack.Id,
        environmentId: stack.EndpointId,
        restartSchedule: null,
      },
      {
        onError(err) {
          notifyError(
            'Failure',
            err as Error,
            'Unable to disable stack redeploy schedule'
          );
        },
        onSuccess() {
          notifySuccess(
            'Success',
            'Stack redeploy schedule disabled successfully'
          );
        },
      }
    );
  }
}

function formatServerTime(value?: string) {
  if (!value) {
    return undefined;
  }

  const isoMatch = value.match(/T(\d{2}:\d{2}:\d{2})/);
  if (isoMatch) {
    return isoMatch[1];
  }

  const rfcMatch = value.match(/\b(\d{2}:\d{2}:\d{2})\b/);
  if (rfcMatch) {
    return rfcMatch[1];
  }

  return value;
}
