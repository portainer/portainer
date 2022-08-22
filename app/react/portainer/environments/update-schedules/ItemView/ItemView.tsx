import { Settings } from 'react-feather';
import { Formik, Form as FormikForm } from 'formik';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import { useMemo } from 'react';
import { object, SchemaOf } from 'yup';

import { notifySuccess } from '@/portainer/services/notifications';
import {
  useRedirectFeatureFlag,
  FeatureFlag,
} from '@/portainer/feature-flags/useRedirectFeatureFlag';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';
import { LoadingButton } from '@@/buttons';

import { UpdateTypeTabs } from '../common/UpdateTypeTabs';
import { useItem } from '../queries/useItem';
import { validation } from '../common/validation';
import { useUpdateMutation } from '../queries/useUpdateMutation';
import { useList } from '../queries/list';
import { NameField, nameValidation } from '../common/NameField';
import { EdgeGroupsField } from '../common/EdgeGroupsField';
import { EdgeUpdateSchedule } from '../types';
import { FormValues } from '../common/types';

export function ItemView() {
  useRedirectFeatureFlag(FeatureFlag.EdgeRemoteUpdate);

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

  const isDisabled = useMemo(
    () => (itemQuery.data ? itemQuery.data.time < Date.now() / 1000 : false),
    [itemQuery.data]
  );

  if (!itemQuery.data || !schedulesQuery.data) {
    return null;
  }

  const item = itemQuery.data;
  const schedules = schedulesQuery.data;
  return (
    <>
      <PageHeader
        title="Update & Rollback"
        breadcrumbs={['Edge agent update and rollback', item.name]}
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Title title="Update & Rollback Scheduler" icon={Settings} />
            <Widget.Body>
              <Formik
                initialValues={item}
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
                validationSchema={() => updateValidation(item, schedules)}
              >
                {({ isValid }) => (
                  <FormikForm className="form-horizontal">
                    <NameField />

                    <EdgeGroupsField disabled={isDisabled} />

                    <UpdateTypeTabs disabled={isDisabled} />

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
  item: EdgeUpdateSchedule,
  schedules: EdgeUpdateSchedule[]
): SchemaOf<{ name: string } | FormValues> {
  return item.time > Date.now() / 1000
    ? validation(schedules, item.id)
    : object({ name: nameValidation(schedules, item.id) });
}
