import { Settings } from 'lucide-react';
import { Formik, Form as FormikForm } from 'formik';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import { object, SchemaOf } from 'yup';

import { notifySuccess } from '@/portainer/services/notifications';
import { withLimitToBE } from '@/react/hooks/useLimitToBE';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';
import { LoadingButton } from '@@/buttons';
import { TextTip } from '@@/Tip/TextTip';

import { useItem } from '../queries/useItem';
import { validation } from '../common/validation';
import { useUpdateMutation } from '../queries/useUpdateMutation';
import { useList } from '../queries/list';
import { NameField, nameValidation } from '../common/NameField';
import { EdgeGroupsField } from '../common/EdgeGroupsField';
import { EdgeUpdateSchedule, StatusType } from '../types';
import { FormValues } from '../common/types';
import { ScheduleTypeSelector } from '../common/ScheduleTypeSelector';
import { BetaAlert } from '../common/BetaAlert';

export default withLimitToBE(ItemView);

function ItemView() {
  const {
    params: { id: idParam },
  } = useCurrentStateAndParams();

  const id = parseInt(idParam, 10);

  if (!idParam || Number.isNaN(id)) {
    throw new Error('id is a required path param');
  }

  const updateMutation = useUpdateMutation();
  const router = useRouter();
  const itemQuery = useItem(id);
  const schedulesQuery = useList();

  if (!itemQuery.data || !schedulesQuery.data) {
    return null;
  }

  const item = itemQuery.data;
  const isScheduleActive = item.status !== StatusType.Pending;

  const schedules = schedulesQuery.data;

  const initialValues: FormValues = {
    name: item.name,
    groupIds: item.edgeGroupIds,
    type: item.type,
    version: item.version,
  };

  const environmentsCount = Object.keys(
    item.environmentsPreviousVersions
  ).length;

  return (
    <>
      <PageHeader
        title="Update & Rollback"
        breadcrumbs={[
          { label: 'Edge agent update and rollback', link: '^' },
          item.name,
        ]}
      />

      <BetaAlert />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Title title="Update & Rollback Scheduler" icon={Settings} />
            <Widget.Body>
              <Formik
                initialValues={initialValues}
                onSubmit={(values) => {
                  updateMutation.mutate(
                    { id, values },
                    {
                      onSuccess() {
                        notifySuccess(
                          'Success',
                          'Updated schedule successfully'
                        );
                        router.stateService.go('^');
                      },
                    }
                  );
                }}
                validateOnMount
                validationSchema={() =>
                  updateValidation(item.id, schedules, isScheduleActive)
                }
              >
                {({ isValid }) => (
                  <FormikForm className="form-horizontal">
                    <NameField />

                    <EdgeGroupsField disabled={isScheduleActive} />

                    {isScheduleActive ? (
                      <TextTip color="blue">
                        {environmentsCount} environment(s) will be updated to
                        version {item.version}
                      </TextTip>
                    ) : (
                      <ScheduleTypeSelector />
                    )}

                    <div className="form-group">
                      <div className="col-sm-12">
                        <LoadingButton
                          disabled={!isValid}
                          isLoading={updateMutation.isLoading}
                          loadingText="Updating..."
                        >
                          Update Schedule
                        </LoadingButton>
                      </div>
                    </div>
                  </FormikForm>
                )}
              </Formik>
            </Widget.Body>
          </Widget>
        </div>
      </div>
    </>
  );
}

function updateValidation(
  itemId: EdgeUpdateSchedule['id'],
  schedules: EdgeUpdateSchedule[],
  isScheduleActive: boolean
): SchemaOf<{ name: string } | FormValues> {
  return !isScheduleActive
    ? validation(schedules, itemId)
    : object({ name: nameValidation(schedules, itemId) });
}
