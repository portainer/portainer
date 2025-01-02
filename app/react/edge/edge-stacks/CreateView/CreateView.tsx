import { PageHeader } from '@@/PageHeader';

import { CreateForm } from './CreateForm';

export function CreateView() {
  return (
    <>
      <PageHeader
        title="Create Edge Stack"
        breadcrumbs={[
          { label: 'Edge Stacks', link: 'edge.stacks' },
          'Create Edge Stack',
        ]}
        reload
      />

      <CreateForm />
    </>
  );
}
