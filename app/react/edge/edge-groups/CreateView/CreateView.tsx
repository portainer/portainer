import { useRouter } from '@uirouter/react';

import { notifySuccess } from '@/portainer/services/notifications';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';

import { useCreateEdgeGroupMutation } from '../queries/useCreateEdgeGroupMutation';
import { EdgeGroupForm } from '../components/EdgeGroupForm/EdgeGroupForm';

export function CreateView() {
  const mutation = useCreateEdgeGroupMutation();
  const router = useRouter();

  return (
    <>
      <PageHeader
        title="Create edge group"
        breadcrumbs={[
          { label: 'Edge groups', link: 'edge.groups' },
          'Add edge group',
        ]}
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Body>
              <EdgeGroupForm
                onSubmit={({ environmentIds, ...values }) => {
                  mutation.mutate(
                    {
                      endpoints: environmentIds,
                      ...values,
                    },
                    {
                      onSuccess: () => {
                        notifySuccess(
                          'Success',
                          'Edge group successfully created'
                        );
                        router.stateService.go('^');
                      },
                    }
                  );
                }}
                isLoading={mutation.isLoading}
              />
            </Widget.Body>
          </Widget>
        </div>
      </div>
    </>
  );
}
