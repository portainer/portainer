import { useCurrentStateAndParams } from '@uirouter/react';
import { Plus } from 'lucide-react';

import { AutomationTestingProps } from '@/types';

import { MenuButton, MenuButtonLink } from '@@/buttons/MenuButton';
import { Icon } from '@@/Icon';

export function CreateFromManifestButton({
  params = {},
  'data-cy': dataCy,
}: { params?: object } & AutomationTestingProps) {
  const { state } = useCurrentStateAndParams();
  return (
    <MenuButton
      items={[
        <MenuButtonLink
          key="manifest"
          to="kubernetes.deploy"
          params={{
            referrer: state.name,
            ...params,
          }}
          label="Create from manifest"
          data-cy={`${dataCy}-manifest`}
        >
          Manifest
        </MenuButtonLink>,
        <MenuButtonLink
          key="helm"
          to="kubernetes.helminstall"
          params={{
            referrer: state.name,
            ...params,
          }}
          label="Create from Helm chart"
          data-cy={`${dataCy}-helm`}
        >
          Helm chart
        </MenuButtonLink>,
      ]}
      data-cy={dataCy}
    >
      <Icon icon={Plus} size="xs" />
      Create from code
    </MenuButton>
  );
}
