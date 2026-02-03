import { useRouter } from '@uirouter/react';
import { useMemo } from 'react';
import { FormikHelpers } from 'formik';

import { useEnvironmentList } from '@/react/portainer/environments/queries';
import { notifySuccess } from '@/portainer/services/notifications';
import { useIdParam } from '@/react/hooks/useIdParam';

import { Widget } from '@@/Widget';
import { PageHeader } from '@@/PageHeader';
import { Alert } from '@@/Alert';

import { useGroup } from '../queries/useGroup';
import { useUpdateGroupMutation } from '../queries/useUpdateGroupMutation';
import { GroupForm, GroupFormValues } from '../components/GroupForm';

export function EditGroupView() {
  const groupId = useIdParam();
  const router = useRouter();
  const groupQuery = useGroup(groupId);
  const updateMutation = useUpdateGroupMutation();

  // Fetch associated environments for this group (not for unassigned group)
  const isUnassignedGroup = groupId === 1;
  const environmentsQuery = useEnvironmentList(
    { groupIds: [groupId] },
    { enabled: !!groupId && !isUnassignedGroup }
  );

  const isLoading =
    groupQuery.isLoading || (!isUnassignedGroup && environmentsQuery.isLoading);

  const initialValues: GroupFormValues = useMemo(
    () => ({
      name: groupQuery.data?.Name ?? '',
      description: groupQuery.data?.Description ?? '',
      tagIds: groupQuery.data?.TagIds ?? [],
      associatedEnvironments:
        environmentsQuery.environments?.map((e) => e.Id) ?? [],
    }),
    [groupQuery.data, environmentsQuery.environments]
  );

  return (
    <>
      <PageHeader
        title="Environment group details"
        breadcrumbs={[
          { label: 'Groups', link: 'portainer.groups' },
          { label: groupQuery.data?.Name ?? 'Edit group' },
        ]}
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Body loading={isLoading}>
              {groupQuery.isError && (
                <Alert color="error" title="Error">
                  Failed to load group details
                </Alert>
              )}
              {!groupQuery.isError && groupQuery.data && (
                <GroupForm
                  initialValues={initialValues}
                  onSubmit={handleSubmit}
                  submitLabel="Update"
                  submitLoadingLabel="Updating..."
                  groupId={groupId}
                />
              )}
            </Widget.Body>
          </Widget>
        </div>
      </div>
    </>
  );

  async function handleSubmit(
    values: GroupFormValues,
    { resetForm }: FormikHelpers<GroupFormValues>
  ) {
    await updateMutation.mutateAsync(
      {
        id: groupId,
        name: values.name,
        description: values.description,
        tagIds: values.tagIds,
        associatedEnvironments: values.associatedEnvironments,
      },
      {
        onSuccess() {
          resetForm();
          notifySuccess('Success', 'Group successfully updated');
          router.stateService.go('portainer.groups');
        },
      }
    );
  }
}
