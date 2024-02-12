import { useCurrentStateAndParams } from '@uirouter/react';

import { AutomationTestingProps } from '@/types';

import { AddButton } from '@@/buttons';

export function CreateFromManifestButton({
  params = {},
  'data-cy': dataCy,
}: { params?: object } & AutomationTestingProps) {
  const { state } = useCurrentStateAndParams();
  return (
    <AddButton
      to="kubernetes.deploy"
      params={{
        referrer: state.name,
        ...params,
      }}
      data-cy={dataCy}
    >
      Create from manifest
    </AddButton>
  );
}
