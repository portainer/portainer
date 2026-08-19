import { openSwitchPrompt } from '@@/modals/SwitchPrompt';
import { buildConfirmButton } from '@@/modals/utils';

export async function confirmUpdateAppIngress(
  ingressesToUpdate: Array<unknown>,
  servicePortsToUpdate: Array<unknown>
) {
  const hasOneIngress = ingressesToUpdate.length === 1;
  const hasOnePort = servicePortsToUpdate.length === 1;
  const rulePlural = !hasOneIngress ? 'rules' : 'rule';
  const noMatchSentence = !hasOnePort
    ? `Service ports in this application no longer match the ingress ${rulePlural}.`
    : `A service port in this application no longer matches the ingress ${rulePlural} which may break ingress rule paths.`;
  const inputLabel = `Update ingress ${rulePlural} to match the service port changes`;

  const result = await openSwitchPrompt('Are you sure?', inputLabel, {
    message: (
      <ul className="ml-3">
        <li>Updating the application may cause a service interruption.</li>
        <li>{noMatchSentence}</li>
      </ul>
    ),
    confirmButton: buildConfirmButton('Update'),
    'data-cy': 'kube-update-ingress-prompt-switch',
  });

  return result ? { noMatch: result.value } : undefined;
}
