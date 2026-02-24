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

      <div className="row pb-20">
        <div className="col-sm-12">
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
      </div>
    </>
  );

  async function handleSubmit(
    values: GroupFormValues,
    { resetForm }: FormikHelpers<GroupFormValues>
  ) {
    await createMutation.mutateAsync(
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
      }
    );
  }
}
