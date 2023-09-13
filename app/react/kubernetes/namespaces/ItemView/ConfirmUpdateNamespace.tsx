import { ModalType } from '@@/modals';
import { confirm } from '@@/modals/confirm';
import { buildConfirmButton } from '@@/modals/utils';

export function confirmUpdateNamespace(
  quotaWarning: boolean,
  ingressWarning: boolean,
  registriesWarning: boolean
) {
  const message = (
    <>
      {quotaWarning && (
        <p>
          Reducing the quota assigned to an &quot;in-use&quot; namespace may
          have unintended consequences, including preventing running
          applications from functioning correctly and potentially even blocking
          them from running at all.
        </p>
      )}
      {ingressWarning && (
        <p>
          Deactivating ingresses may cause applications to be unaccessible. All
          ingress configurations from affected applications will be removed.
        </p>
      )}
      {registriesWarning && (
        <p>
          Some registries you removed might be used by one or more applications
          inside this environment. Removing the registries access could lead to
          a service interruption for these applications.
        </p>
      )}
      <p>Are you sure you want to continue?</p>
    </>
  );

  return confirm({
    title: 'Are you sure?',
    modalType: ModalType.Warn,
    message,
    confirmButton: buildConfirmButton('Update', 'primary'),
  });
}
