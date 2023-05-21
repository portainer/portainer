import { Check, CheckCircle, Trash2 } from 'lucide-react';

import { notifySuccess } from '@/portainer/services/notifications';
import { useDeleteEnvironmentsMutation } from '@/react/portainer/environments/queries/useDeleteEnvironmentsMutation';
import { Environment } from '@/react/portainer/environments/types';
import { withReactQuery } from '@/react-tools/withReactQuery';

import { Button } from '@@/buttons';
import { ModalType, openModal } from '@@/modals';
import { confirm } from '@@/modals/confirm';
import { buildConfirmButton } from '@@/modals/utils';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';

import { useAssociateDeviceMutation, useLicenseOverused } from '../queries';
import { WaitingRoomEnvironment } from '../types';

import { AssignmentDialog } from './AssignmentDialog/AssignmentDialog';

const overusedTooltip = (
  <>
    Associating devices is disabled as your node count exceeds your license
    limit
  </>
);

export function TableActions({
  selectedRows,
}: {
  selectedRows: WaitingRoomEnvironment[];
}) {
  const associateMutation = useAssociateDeviceMutation();
  const removeMutation = useDeleteEnvironmentsMutation();
  const licenseOverused = useLicenseOverused(selectedRows.length);

  return (
    <>
      <Button
        onClick={() => handleRemoveDevice(selectedRows)}
        disabled={selectedRows.length === 0}
        color="dangerlight"
        icon={Trash2}
      >
        Remove Device
      </Button>

      <TooltipWithChildren
        message={
          licenseOverused ? (
            overusedTooltip
          ) : (
            <>
              Associate device(s) and assigning edge groups, group and tags with
              overriding options
            </>
          )
        }
      >
        <span>
          <Button
            onClick={() => handleAssociateAndAssign(selectedRows)}
            disabled={selectedRows.length === 0 || licenseOverused}
            color="secondary"
            icon={CheckCircle}
          >
            Associate and assignment
          </Button>
        </span>
      </TooltipWithChildren>

      <TooltipWithChildren
        message={
          licenseOverused ? (
            overusedTooltip
          ) : (
            <>
              Associate device(s) based on their pre-assigned edge groups, group
              and tags
            </>
          )
        }
      >
        <span>
          <Button
            onClick={() => handleAssociateDevice(selectedRows)}
            disabled={selectedRows.length === 0 || licenseOverused}
            icon={Check}
          >
            Associate Device
          </Button>
        </span>
      </TooltipWithChildren>
    </>
  );

  async function handleAssociateAndAssign(
    environments: WaitingRoomEnvironment[]
  ) {
    const assigned = await openModal(withReactQuery(AssignmentDialog), {
      environments,
    });

    if (!assigned) {
      return;
    }

    handleAssociateDevice(environments);
  }

  function handleAssociateDevice(devices: Environment[]) {
    associateMutation.mutate(
      devices.map((d) => d.Id),
      {
        onSuccess() {
          notifySuccess('Success', 'Edge devices associated successfully');
        },
      }
    );
  }

  async function handleRemoveDevice(devices: Environment[]) {
    const confirmed = await confirm({
      title: 'Are you sure?',
      message:
        "You're about to remove edge device(s) from waiting room, which will not be shown until next agent startup.",
      confirmButton: buildConfirmButton('Remove', 'danger'),
      modalType: ModalType.Destructive,
    });

    if (!confirmed) {
      return;
    }

    removeMutation.mutate(
      devices.map((d) => d.Id),
      {
        onSuccess() {
          notifySuccess('Success', 'Edge devices were hidden successfully');
        },
      }
    );
  }
}
