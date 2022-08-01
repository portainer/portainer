import sanitize from 'sanitize-html';
import bootbox from 'bootbox';

import {
  cancelRegistryRepositoryAction,
  confirmAsync,
  confirmWarn,
  confirmDestructive,
  confirmDestructiveAsync,
  confirmDisassociate,
  confirmDeletion,
  confirmDetachment,
  confirmDeletionAsync,
  confirmChangePassword,
  confirmImageExport,
  confirmImageForceRemoval,
  confirmRedeploy,
  confirmUpdate,
  confirmWebEditorDiscard,
  confirm,
  confirmForceChangePassword,
  confirmWithTitle,
} from './confirm';
import {
  confirmContainerDeletion,
  confirmContainerRecreation,
  confirmServiceForceUpdate,
  confirmStackUpdate,
  selectRegistry,
} from './prompt';

export function enlargeImage(imageUrl: string) {
  const imageSanitized = sanitize(imageUrl);

  bootbox.dialog({
    message: `<img src="${imageSanitized}" style="width:100%" />`,
    className: 'image-zoom-modal',
    onEscape: true,
  });
}

/* @ngInject */
export function ModalServiceAngular() {
  return {
    enlargeImage,
    confirmWebEditorDiscard,
    confirmAsync,
    confirmWarn,
    confirmDestructive,
    confirmDestructiveAsync,
    confirm,
    confirmImageForceRemoval,
    cancelRegistryRepositoryAction,
    confirmDeletion,
    confirmDetachment,
    confirmDisassociate,
    confirmUpdate,
    confirmRedeploy,
    confirmDeletionAsync,
    confirmContainerRecreation,
    confirmChangePassword,
    confirmImageExport,
    confirmServiceForceUpdate,
    confirmStackUpdate,
    selectRegistry,
    confirmContainerDeletion,
    confirmForceChangePassword,
    confirmWithTitle,
  };
}
