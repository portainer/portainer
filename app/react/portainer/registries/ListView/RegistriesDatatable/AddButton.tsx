import { AddButton as BaseAddButton } from '@@/buttons';

export function AddButton() {
  return (
    <BaseAddButton
      data-cy="registry-addRegistryButton"
      to="portainer.registries.new"
    >
      Add registry
    </BaseAddButton>
  );
}
