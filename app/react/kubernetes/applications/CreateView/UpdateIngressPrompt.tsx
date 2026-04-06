import i18n from '@/i18n';
import { openSwitchPrompt } from '@@/modals/SwitchPrompt';
import { buildConfirmButton } from '@@/modals/utils';

export async function confirmUpdateAppIngress(
  ingressesToUpdate: Array<unknown>,
  servicePortsToUpdate: Array<unknown>
) {
  const hasOneIngress = ingressesToUpdate.length === 1;
  const hasOnePort = servicePortsToUpdate.length === 1;
  const t = i18n.t.bind(i18n);
  const rulePlural = !hasOneIngress ? 'rules' : 'rule';
  const noMatchSentence = !hasOnePort
    ? t('kubernetes.applications.update.portsNoMatchPlural', { rulePlural })
    : t('kubernetes.applications.update.portsNoMatchSingular', { rulePlural });
  const inputLabel = t('kubernetes.applications.update.updateIngressRules', { rulePlural });

  const result = await openSwitchPrompt(
    t('kubernetes.applications.update.areYouSure'),
    inputLabel,
    {
      message: (
        <ul className="ml-3">
          <li>{t('kubernetes.applications.update.serviceInterruption')}</li>
          <li>{noMatchSentence}</li>
        </ul>
      ),
      confirmButton: buildConfirmButton(t('kubernetes.applications.update.updateButton')),
      'data-cy': 'kube-update-ingress-prompt-switch',
    }
  );

  return result ? { noMatch: result.value } : undefined;
}
