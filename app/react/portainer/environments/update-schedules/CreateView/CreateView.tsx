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
import { UpdateTypeTabs } from '../common/UpdateTypeTabs';
import { useGetList } from '../queries/list';

const initialValues: FormValues = {
  name: '',
  groupIds: [],
  type: ScheduleType.Upgrade,
  version: 'latest',
  time: Math.floor(Date.now() / 1000) + 60 * 60,
};

export function CreateView() {
  useRedirectFeatureFlag(FeatureFlag.EdgeRemoteUpdate);
  const schedulesQuery = useGetList();

  const createMutation = useCreateMutation();
  const router = useRouter();

  if (!schedulesQuery.data) {
    return null;
  }

  const schedules = schedulesQuery.data;

  return (
    <>
      <PageHeader
        title="Upgrade & Rollback"
        breadcrumbs="Edge agent upgrade and rollback"
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Title
              title="Upgrade & Rollback Scheduler"
              icon={Settings}
            />
            <Widget.Body>
              <Formik
                initialValues={initialValues}
                onSubmit={(values) => {
                  createMutation.mutate(values, {
                    onSuccess() {
                      notifySuccess('Success', 'Created schedule successfully');
                      router.stateService.go('^');
                    },
                  });
                }}
                validateOnMount
                validationSchema={() => validation(schedules)}
              >
                {({ isValid }) => (
                  <FormikForm className="form-horizontal">
                    <UpdateTypeTabs />
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
}
