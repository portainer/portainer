import {
  ArrowRightIcon,
  PlayIcon,
  PlusIcon,
  StopCircleIcon,
  Trash2Icon,
} from 'lucide-react';
import { useRouter } from '@uirouter/react';
import { useTranslation } from 'react-i18next';

import { Authorized } from '@/react/hooks/useUser';
import { Stack, StackStatus } from '@/react/common/stacks/types';
import { useDeleteStackMutation } from '@/react/common/stacks/queries/useDeleteStackMutation';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';

import { Button, LoadingButton } from '@@/buttons';
import { Link } from '@@/Link';
import { confirm, confirmDelete } from '@@/modals/confirm';
import { ModalType } from '@@/modals/Modal/types';
import { buildConfirmButton } from '@@/modals/utils';

import { useUpdateStackMutation } from '../../useUpdateStack';

import { useStartStackMutation } from './useStartStackMutation';
import { useStopStackMutation } from './useStopStackMutation';

export function StackActions({
  stack,
  fileContent,
  isRegular,
  environmentId,
  isExternal,
  status,
}: {
  stack: Stack;
  fileContent?: string;
  isRegular?: boolean;
  environmentId: number;
  isExternal: boolean;
  status: Stack['Status'];
}) {
  const router = useRouter();
  const startStackMutation = useStartStackMutation();
  const stopStackMutation = useStopStackMutation();
  const deleteStackMutation = useDeleteStackMutation();
  const detachFromGitMutation = useUpdateStackMutation();
  const { t } = useTranslation();

  const isMutating =
    startStackMutation.isLoading ||
    stopStackMutation.isLoading ||
    deleteStackMutation.isLoading ||
    detachFromGitMutation.isLoading;

  const stackId = stack.Id;

  return (
    <div className="flex items-center gap-2">
      {isRegular && (
        <Authorized authorizations="PortainerStackUpdate">
          {status === StackStatus.Active ? (
            <Button
              icon={StopCircleIcon}
              color="dangerlight"
              size="xsmall"
              onClick={() => handleStop()}
              disabled={isMutating}
              data-cy="stack-stop-btn"
            >
              {t('docker.stacks.stop_stack')}
            </Button>
          ) : (
            <Button
              icon={PlayIcon}
              color="success"
              data-cy="stack-start-btn"
              size="xsmall"
              disabled={isMutating}
              onClick={() =>
                startStackMutation.mutate(
                  { id: stackId, environmentId },
                  {
                    onError(err) {
                      notifyError(
                        t('common.failure'),
                        err as Error,
                        t('docker.stacks.notifications.unable_start')
                      );
                    },
                    onSuccess() {
                      notifySuccess(
                        t('common.success'),
                        `Stack ${stack.Name} ${t('docker.stacks.notifications.started')}`
                      );
                      router.stateService.reload();
                    },
                  }
                )
              }
            >
              {t('docker.stacks.start_stack')}
            </Button>
          )}
        </Authorized>
      )}

      <Authorized authorizations="PortainerStackDelete">
        <Button
          icon={Trash2Icon}
          color="dangerlight"
          size="xsmall"
          onClick={() => handleDelete()}
          disabled={isMutating}
          data-cy="stack-delete-btn"
        >
          {t('docker.stacks.delete_stack')}
        </Button>
      </Authorized>

      {!!(isRegular && fileContent) && (
        <Button
          as={Link}
          icon={PlusIcon}
          color="primary"
          size="xsmall"
          data-cy="stack-create-template-btn"
          props={{
            to: 'docker.templates.custom.new',
            params: {
              fileContent,
              type: stack.Type,
            },
          }}
        >
          {t('docker.stacks.create_template')}
        </Button>
      )}

      {!!(
        isRegular &&
        fileContent &&
        !stack.FromAppTemplate &&
        stack.GitConfig
      ) && (
        <Authorized authorizations="PortainerStackUpdate">
          <LoadingButton
            icon={ArrowRightIcon}
            color="primary"
            size="xsmall"
            onClick={() => handleDetachFromGit()}
            disabled={isMutating}
            data-cy="stack-detach-git-btn"
            isLoading={detachFromGitMutation.isLoading}
            loadingText={t('docker.stacks.detaching')}
          >
            {t('docker.stacks.detach_git')}
          </LoadingButton>
        </Authorized>
      )}
    </div>
  );

  async function handleStop() {
    const confirmed = await confirm({
      title: t('docker.stacks.confirm_stop.title'),
      modalType: ModalType.Warn,
      message: t('docker.stacks.confirm_stop.message'),
      confirmButton: buildConfirmButton(t('common.stop'), 'danger'),
    });

    if (!confirmed) {
      return;
    }

    stopStackMutation.mutate(
      { id: stackId, environmentId },
      {
        onError(err) {
          notifyError(t('common.failure'), err as Error, t('docker.stacks.notifications.unable_stop'));
        },
        onSuccess() {
          notifySuccess(t('common.success'), `Stack ${stack.Name} ${t('docker.stacks.notifications.stopped')}`);
          router.stateService.reload();
        },
      }
    );
  }

  async function handleDelete() {
    const confirmed = await confirmDelete(
      t('docker.stacks.confirm_delete')
    );
    if (!confirmed) {
      return;
    }
    deleteStackMutation.mutate(
      {
        id: stack.Id,
        name: stack.Name,
        environmentId: stack.EndpointId,
        external: isExternal,
      },
      {
        onError(err) {
          notifyError(
            t('common.failure'),
            err as Error,
            `${t('docker.stacks.notifications.unable_remove')} ${stack.Name}`
          );
        },
        onSuccess() {
          notifySuccess(t('docker.stacks.notifications.removed'), stack.Name);
          router.stateService.go('^');
        },
      }
    );
  }

  async function handleDetachFromGit() {
    const confirmed = await confirm({
      modalType: ModalType.Warn,
      title: t('docker.stacks.confirm_detach.title'),
      message: t('docker.stacks.confirm_detach.message'),
      confirmButton: buildConfirmButton(t('common.detach'), 'danger'),
    });

    if (!confirmed) {
      return;
    }

    detachFromGitMutation.mutate(
      {
        environmentId,
        stackId: stack.Id,
        payload: {
          stackFileContent: fileContent!,
          env: stack.Env,
          prune: false,
        },
      },
      {
        onSuccess() {
          router.stateService.go('^');
        },
      }
    );
  }
}
