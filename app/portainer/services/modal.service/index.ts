import sanitize from 'sanitize-html';
import bootbox from 'bootbox';

import {
  cancelRegistryRepositoryAction,
  confirmAccessControlUpdate,
  confirmAsync,
  confirmDeassociate,
  confirmDeletion,
  confirmDetachment,
  confirmDeletionAsync,
  confirmEndpointSnapshot,
  confirmChangePassword,
  confirmImageExport,
  confirmImageForceRemoval,
  confirmRedeploy,
  confirmUpdate,
  confirmWebEditorDiscard,
  confirm,
} from './confirm';
import {
  confirmContainerDeletion,
  confirmContainerRecreation,
  confirmServiceForceUpdate,
  confirmKubeconfigSelection,
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
    confirm,
    confirmAccessControlUpdate,
    confirmImageForceRemoval,
    cancelRegistryRepositoryAction,
    confirmDeletion,
    confirmDetachment,
    confirmDeassociate,
    confirmUpdate,
    confirmRedeploy,
    confirmDeletionAsync,
    confirmContainerRecreation,
    confirmEndpointSnapshot,
    confirmChangePassword,
    confirmImageExport,
    confirmServiceForceUpdate,
    selectRegistry,
    confirmContainerDeletion,
    confirmKubeconfigSelection,
  };
}
