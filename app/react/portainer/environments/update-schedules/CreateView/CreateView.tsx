import { Settings } from 'react-feather';
import { Formik } from 'formik';
import { useRouter } from '@uirouter/react';

import { notifySuccess } from '@/portainer/services/notifications';
import {
  useRedirectFeatureFlag,
  FeatureFlag,
} from '@/portainer/feature-flags/useRedirectFeatureFlag';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';

import { ScheduleType } from '../types';
import { useCreateMutation } from '../queries/create';

import { FormValues } from './types';
import { validation } from './validation';
import { Form } from './Form';

const initialValues: FormValues = {
  name: '',
  groupIds: [],
  type: ScheduleType.Upgrade,
  version: 'latest',
  time: Date.now() + 60 * 60 * 1000,
};

export function CreateView() {
  useRedirectFeatureFlag(FeatureFlag.EdgeRemoteUpdate);

  const createMutation = useCreateMutation();
  const router = useRouter();
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
                validationSchema={validation}
              >
                <Form isLoading={createMutation.isLoading} />
              </Formik>
            </Widget.Body>
          </Widget>
        </div>
      </div>
    </>
  );
}
