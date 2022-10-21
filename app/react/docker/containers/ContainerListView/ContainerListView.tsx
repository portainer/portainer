import { NamespaceContainer } from '@/portainer/environments/types';

import { PageHeader } from '@@/PageHeader';

import { ContainersDatatable } from './ContainersDatatable';

export interface Props {
    namespace: NamespaceContainer;
}

export function ContainerListView({ namespace }: Props) {
  const isHostColumnVisible = true;
  return (
    <>
      <PageHeader
        title="Container list"
        breadcrumbs={[{ label: 'Namespaces', link: 'portainer.namespaces'}, 'Container list']}
        reload
      />
      
      <ContainersDatatable
        isHostColumnVisible={isHostColumnVisible}
        namespace={namespace}
      /> 
    </>
  );
}
