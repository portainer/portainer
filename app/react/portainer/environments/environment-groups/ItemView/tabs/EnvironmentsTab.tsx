import { FormikHelpers } from 'formik';
import { useMemo } from 'react';

import { useIdParam } from '@/react/hooks/useIdParam';
import { useEnvironmentList } from '@/react/portainer/environments/queries';

import { Widget } from '@@/Widget';

import { useGroup } from '../../queries/useGroup';
import { useUpdateGroupMutation } from '../../queries/useUpdateGroupMutation';
import { GroupForm, GroupFormValues } from '../../components/GroupForm';
import { AssociatedEnvironmentsSelector } from '../../components/AssociatedEnvironmentsSelector/AssociatedEnvironmentsSelector';
import { isUngoverned } from '../../utils/getPlatformLabel';

interface Props {
  externalDrawerOpen?: boolean;
  onExternalDrawerClose?: () => void;
}

export function EnvironmentsTab({
  externalDrawerOpen,
  onExternalDrawerClose,
}: Props) {
  const groupId = useIdParam();
  const groupQuery = useGroup(groupId);
  const environmentsQuery = useEnvironmentList({
    groupIds: [groupId],
    pageLimit: 0,
  });
  const updateMutation = useUpdateGroupMutation();

  const currentGroupIsUngoverned = groupQuery.data
    ? isUngoverned(groupQuery.data)
    : false;

  const initialValues: GroupFormValues = useMemo(
    () => ({
      name: groupQuery.data?.Name ?? '',
      description: groupQuery.data?.Description ?? '',
      tagIds: groupQuery.data?.TagIds ?? [],
    }),
    [groupQuery.data]
  );

  return (
    <>
      <div className="m-4">
        <Widget>
          <Widget.Body loading={groupQuery.isLoading}>
            {groupQuery.data && (
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

      <div className="pb-20">
        <AssociatedEnvironmentsSelector
          groupId={groupId}
          readOnly={currentGroupIsUngoverned}
          externalDrawerOpen={externalDrawerOpen}
          onExternalDrawerClose={onExternalDrawerClose}
        />
      </div>
    </>
  );

  async function handleSubmit(
    values: GroupFormValues,
    { resetForm }: FormikHelpers<GroupFormValues>
  ) {
    const associatedEnvironments = (environmentsQuery.environments ?? []).map(
      (e) => e.Id
    );
    await updateMutation.mutateAsync(
      {
        id: groupId,
        name: values.name,
        description: values.description,
        tagIds: values.tagIds,
        associatedEnvironments,
      },
      {
        onSuccess() {
          resetForm();
        },
      }
    );
  }
}
