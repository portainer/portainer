import { useTranslation } from 'react-i18next';

import { Authorized } from '@/react/hooks/useUser';

import { AddButton as BaseAddButton } from '@@/buttons';

export function AddButton() {
  const { t } = useTranslation();
  return (
    <Authorized authorizations="OperationPortainerRegistryCreate" adminOnlyCE>
      <BaseAddButton
        data-cy="registry-addRegistryButton"
        to="portainer.registries.new"
      >
        {t('registries.add_registry')}
      </BaseAddButton>
    </Authorized>
  );
}
