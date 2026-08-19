import { useMemo } from 'react';
import { Settings } from 'lucide-react';
import { Formik, Form as FormikForm } from 'formik';
import { useRouter } from '@uirouter/react';

import { notifySuccess } from '@/portainer/services/notifications';
import { withLimitToBE } from '@/react/hooks/useLimitToBE';
import { useEdgeGroups } from '@/react/edge/edge-groups/queries/useEdgeGroups';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';
import { LoadingButton } from '@@/buttons';
import { TextTip } from '@@/Tip/TextTip';
import { Link } from '@@/Link';

import { ScheduleType } from '../types';
import { useCreateMutation } from '../queries/create';
import { FormValues } from '../common/types';
import { validation } from '../common/validation';
import { ScheduleTypeSelector } from '../common/ScheduleTypeSelector';
import { useList } from '../queries/list';
import { NameField } from '../common/NameField';
import { EdgeGroupsField } from '../common/EdgeGroupsField';
import { BetaAlert } from '../common/BetaAlert';
import { defaultValue } from '../common/ScheduledTimeField';

export default withLimitToBE(CreateView);

function CreateView() {
  const initialValues = useMemo<FormValues>(
    () => ({
      name: '',
      groupIds: [],
      type: ScheduleType.Update,
      version: '',
      scheduledTime: defaultValue(),
    }),
    []
  );
  const edgeGroupsQuery = useEdgeGroups();
  const schedulesQuery = useList();

  const createMutation = useCreateMutation();
  const router = useRouter();

  if (!schedulesQuery.data) {
    return null;
  }

  const schedules = schedulesQuery.data;

  return (
    <>
      <PageHeader
        title="Update & Rollback"
        breadcrumbs="Edge agent update and rollback"
        reload
      />

      <BetaAlert
        className="mb-2 ml-[15px]"
        message="Beta feature - currently limited to standalone Linux edge devices."
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Title title="Update & Rollback Scheduler" icon={Settings} />
            <Widget.Body>
              <TextTip color="blue" className="mb-2">
                Devices need to be allocated to an Edge group, visit the{' '}
                <Link
                  to="edge.groups"
                  data-cy="update-schedules-create-edge-groups-link"
                >
                  Edge Groups
                </Link>{' '}
                page to assign environments and create groups.
                <br />
                You can upgrade from any agent version to 2.17 or later only.
                You can not upgrade to an agent version prior to 2.17 . The
                ability to rollback to originating version is for 2.15.0+ only.
              </TextTip>

              <Formik
                initialValues={initialValues}
                onSubmit={handleSubmit}
                validateOnMount
                validationSchema={() =>
                  validation(schedules, edgeGroupsQuery.data)
                }
              >
                {({ isValid, setFieldValue, values, handleBlur, errors }) => (
                  <FormikForm className="form-horizontal">
                    <NameField />
                    <EdgeGroupsField
                      onChange={(value) => setFieldValue('groupIds', value)}
                      value={values.groupIds}
                      onBlur={handleBlur}
                      error={errors.groupIds}
                    />

                    <div className="mt-2">
                      <ScheduleTypeSelector />
                    </div>

                    <div className="form-group">
                      <div className="col-sm-12">
                        <LoadingButton
                          disabled={!isValid}
                          data-cy="update-schedules-create-submit-button"
                          isLoading={createMutation.isLoading}
                          loadingText="Creating..."
                        >
                          Create Schedule
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

  function handleSubmit(values: FormValues) {
    createMutation.mutate(values, {
      onSuccess() {
        notifySuccess('Success', 'Created schedule successfully');
        router.stateService.go('^');
      },
    });
  }
}
