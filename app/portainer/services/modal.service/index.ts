import sanitize from 'sanitize-html';
import bootbox from 'bootbox';

import {
  cancelRegistryRepositoryAction,
  confirmAccessControlUpdate,
  confirmAsync,
  confirmDeassociate,
  confirmDeletion,
  confirmDeletionAsync,
  confirmEndpointSnapshot,
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
    confirmDeassociate,
    confirmUpdate,
    confirmRedeploy,
    confirmDeletionAsync,
    confirmContainerRecreation,
    confirmEndpointSnapshot,
    confirmImageExport,
    confirmServiceForceUpdate,
    selectRegistry,
    confirmContainerDeletion,
  };
}
