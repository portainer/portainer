import { confirm } from '@@/modals/confirm';
import { buildConfirmButton } from '@@/modals/utils';

export function confirmRedeploy() {
  return confirm({
    title: '',
    message: (
      <>
        One or multiple applications are currently using this volume.
        <br /> For the change to be taken into account these applications will
        need to be redeployed. Do you want us to reschedule it now?
      </>
    ),
    confirmButton: buildConfirmButton('Redeploy the applications'),
    cancelButtonLabel: "I'll do it later",
  });
}
