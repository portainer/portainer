import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import { useTranslation } from 'react-i18next';

import { notifySuccess } from '@/portainer/services/notifications';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';
import { Redirect } from '@@/Redirect';

import { useUpdateEdgeGroupMutation } from '../queries/useUpdateEdgeGroupMutation';
import { EdgeGroupForm } from '../components/EdgeGroupForm/EdgeGroupForm';
import { useEdgeGroup } from '../queries/useEdgeGroup';

export function ItemView() {
  const { t } = useTranslation();
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
        title={t('edge.groups_edit')}
        breadcrumbs={[
          { label: t('edge.groups_title'), link: 'edge.groups' },
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
                          t('common.success'),
                          t('edge.groups_updated')
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
