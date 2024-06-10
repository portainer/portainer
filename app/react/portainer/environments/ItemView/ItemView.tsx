import { useCurrentStateAndParams } from '@uirouter/react';

import { PageHeader } from '@@/PageHeader';

import { useEnvironment } from '../queries';
import { isEdgeEnvironment } from '../utils';

import { UpdateForm } from './UpdateForm/UpdateForm';
import { EdgeEnvironmentDetails } from './EdgeEnvironmentDetails';
import { KubeDetails } from './KubeDetails';

export function ItemView() {
  const {
    params: { id },
  } = useCurrentStateAndParams();
  const environmentQuery = useEnvironment(id);

  if (!environmentQuery.data) {
    return null;
  }

  const environment = environmentQuery.data;
  const isEdge = isEdgeEnvironment(environment.Type);

  return (
    <>
      <PageHeader
        title="Environment details"
        breadcrumbs={[
          { label: 'Environments', link: '^' },
          environmentQuery.data.Name || '',
        ]}
        reload
      />

      <div className="mx-[15px]">
        {isEdge && (
          <EdgeEnvironmentDetails environment={environmentQuery.data} />
        )}

        <KubeDetails environment={environmentQuery.data} />

        <div className="mt-4">
          <UpdateForm environment={environmentQuery.data} />
        </div>
      </div>
    </>
  );
}
