import { Check, CheckCircle } from 'lucide-react';

import { notifySuccess } from '@/portainer/services/notifications';
import { useDeleteEnvironmentsMutation } from '@/react/portainer/environments/ListView/useDeleteEnvironmentsMutation';
import { Environment } from '@/react/portainer/environments/types';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { useIsPureAdmin } from '@/react/hooks/useUser';

import { Button } from '@@/buttons';
import { openModal } from '@@/modals';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';
import { DeleteButton } from '@@/buttons/DeleteButton';

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
  const isPureAdmin = useIsPureAdmin();
  const associateMutation = useAssociateDeviceMutation();
  const removeMutation = useDeleteEnvironmentsMutation();
  const licenseOverused = useLicenseOverused(selectedRows.length);

  return (
    <>
      <DeleteButton
        onConfirmed={() => handleRemoveDevice(selectedRows)}
        disabled={selectedRows.length === 0}
        data-cy="remove-device-button"
        confirmMessage="You're about to remove edge device(s) from waiting room, which will not be shown until next agent startup."
      >
        Remove Device
      </DeleteButton>

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
            data-cy="associate-and-assign-button"
            disabled={
              selectedRows.length === 0 || licenseOverused || !isPureAdmin
            }
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
            data-cy="associate-device-button"
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
    removeMutation.mutate(
      devices.map((d) => ({ id: d.Id, name: d.Name })),
      {
        onSuccess() {
          notifySuccess('Success', 'Edge devices were hidden successfully');
        },
      }
    );
  }
}
