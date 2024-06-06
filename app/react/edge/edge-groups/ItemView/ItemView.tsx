import { useCurrentStateAndParams, useRouter } from '@uirouter/react';

import { notifySuccess } from '@/portainer/services/notifications';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';
import { Redirect } from '@@/Redirect';

import { useUpdateEdgeGroupMutation } from '../queries/useUpdateEdgeGroupMutation';
import { EdgeGroupForm } from '../components/EdgeGroupForm/EdgeGroupForm';
import { useEdgeGroup } from '../queries/useEdgeGroup';

export function ItemView() {
  const {
    params: { groupId: id },
  } = useCurrentStateAndParams();
  const groupQuery = useEdgeGroup(id);
  const mutation = useUpdateEdgeGroupMutation();
  const router = useRouter();

  if (groupQuery.isError) {
    return <Redirect to="edge.groups" />;
  }

  if (!groupQuery.data) {
    return null;
  }

  const group = groupQuery.data;
  return (
    <>
      <PageHeader
        title="Edit edge group"
        breadcrumbs={[
          { label: 'Edge groups', link: 'edge.groups' },
          group.Name,
        ]}
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Body>
              <EdgeGroupForm
                group={group}
                onSubmit={({ environmentIds, ...values }) => {
                  mutation.mutate(
                    {
                      id,
                      endpoints: environmentIds,
                      ...values,
                    },
                    {
                      onSuccess: () => {
                        notifySuccess(
                          'Success',
                          'Edge group successfully updated'
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
