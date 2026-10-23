import { useRouter } from '@uirouter/react';
import { FormikHelpers } from 'formik';

import { notifySuccess } from '@/portainer/services/notifications';

import { Widget } from '@@/Widget';
import { PageHeader } from '@@/PageHeader';

import { useCreateGroupMutation } from '../queries/useCreateGroupMutation';
import { GroupForm, GroupFormValues } from '../components/GroupForm';

export function CreateGroupView() {
  const router = useRouter();
  const createMutation = useCreateGroupMutation();

  const initialValues: GroupFormValues = {
    name: '',
    description: '',
    tagIds: [],
    associatedEnvironments: [],
  };

  return (
    <>
      <PageHeader
        title="Create group"
        breadcrumbs={[
          { label: 'Groups', link: 'portainer.groups' },
          { label: 'Create group' },
        ]}
      />

      <div className="mx-4 pb-20">
        <Widget>
          <Widget.Body>
            <GroupForm
              initialValues={initialValues}
              onSubmit={handleSubmit}
              submitLabel="Create"
              submitLoadingLabel="Creating..."
            />
          </Widget.Body>
        </Widget>
      </div>
    </>
  );

  function handleSubmit(
    values: GroupFormValues,
    { resetForm }: FormikHelpers<GroupFormValues>
  ): Promise<void> {
    return new Promise((resolve) => {
      createMutation.mutate(
        {
          name: values.name,
          description: values.description,
          tagIds: values.tagIds,
          associatedEnvironments: values.associatedEnvironments,
        },
        {
          onSuccess: () => {
            resetForm();
            notifySuccess('Success', 'Group successfully created');
            router.stateService.go('portainer.groups');
          },
          onSettled: () => resolve(),
        }
      );
    });
  }
}
