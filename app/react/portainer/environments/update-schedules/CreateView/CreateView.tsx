import { Settings } from 'react-feather';
import { Formik, Form as FormikForm } from 'formik';
import { useRouter } from '@uirouter/react';

import { notifySuccess } from '@/portainer/services/notifications';
import {
  useRedirectFeatureFlag,
  FeatureFlag,
} from '@/portainer/feature-flags/useRedirectFeatureFlag';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';
import { LoadingButton } from '@@/buttons';

import { ScheduleType } from '../types';
import { useCreateMutation } from '../queries/create';
import { FormValues } from '../common/types';
import { validation } from '../common/validation';
import { ScheduleTypeSelector } from '../common/ScheduleTypeSelector';
import { useList } from '../queries/list';
import { EdgeGroupsField } from '../common/EdgeGroupsField';
import { NameField } from '../common/NameField';

const initialValues: FormValues = {
  name: '',
  groupIds: [],
  type: ScheduleType.Update,
  time: Math.floor(Date.now() / 1000) + 60 * 60,
  environments: {},
};

export function CreateView() {
  useRedirectFeatureFlag(FeatureFlag.EdgeRemoteUpdate);
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
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Title title="Update & Rollback Scheduler" icon={Settings} />
            <Widget.Body>
              <Formik
                initialValues={initialValues}
                onSubmit={handleSubmit}
                validateOnMount
                validationSchema={() => validation(schedules)}
              >
                {({ isValid }) => (
                  <FormikForm className="form-horizontal">
                    <NameField />
                    <EdgeGroupsField />
                    <ScheduleTypeSelector />
                    <div className="form-group">
                      <div className="col-sm-12">
                        <LoadingButton
                          disabled={!isValid}
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
