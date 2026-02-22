import { useRouter, useCurrentStateAndParams } from '@uirouter/react';
import { Formik, Form, Field } from 'formik';
import * as yup from 'yup';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';
import { Input } from '@@/form-components/Input';
import { FormControl } from '@@/form-components/FormControl';
import { Select } from '@@/form-components/Input';
import { useCreateBackupSchedule, useUpdateBackupSchedule, useBackupSchedule } from './queries';
import { LoadingButton } from '@@/buttons/LoadingButton';

export function BackupScheduleItemView() {
  const router = useRouter();
  const { params } = useCurrentStateAndParams();
  const id = params.id;
  const isEdit = !!id;

  const query = useBackupSchedule(id, { enabled: isEdit });
  const createMutation = useCreateBackupSchedule();
  const updateMutation = useUpdateBackupSchedule();

  const initialValues = isEdit && query.data ? {
    name: query.data.Name,
    schedule: query.data.Schedule,
    endpointId: query.data.EndpointId,
    retentionDays: query.data.Retention.Days,
    targetType: query.data.TargetType,
  } : {
    name: '',
    schedule: '0 0 * * 0',
    endpointId: 1, // Default or selector
    retentionDays: 7,
    targetType: 's3',
  };

  const validationSchema = yup.object({
    name: yup.string().required('Name is required'),
    schedule: yup.string().required('Schedule is required'),
    endpointId: yup.number().required('Endpoint is required'),
    retentionDays: yup.number().required('Retention is required'),
  });

  async function handleSubmit(values: typeof initialValues) {
    const payload = {
      Name: values.name,
      Schedule: values.schedule,
      EndpointId: Number(values.endpointId),
      Retention: { Days: Number(values.retentionDays), Hours: 0, Weeks: 0, Months: 0, Years: 0 },
      TargetType: values.targetType,
      Include: [],
      Exclude: [],
      TargetDetails: {},
    };

    if (isEdit) {
      await updateMutation.mutateAsync({ id: Number(id), ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    router.stateService.go('portainer.backupSchedules');
  }

  if (isEdit && query.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit Backup Schedule' : 'Create Backup Schedule'}
        breadcrumbs={[
          { label: 'Backup Schedules', link: 'portainer.backupSchedules' },
          isEdit ? 'Edit' : 'Create',
        ]}
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Body>
              <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
              >
                {({ isValid, dirty, isSubmitting }) => (
                  <Form className="form-horizontal">
                    <FormControl label="Name" inputId="name" required>
                      <Field as={Input} name="name" id="name" />
                    </FormControl>

                    <FormControl label="Schedule (Cron)" inputId="schedule" required>
                      <Field as={Input} name="schedule" id="schedule" />
                    </FormControl>

                    <FormControl label="Endpoint ID" inputId="endpointId" required>
                      <Field as={Input} name="endpointId" id="endpointId" type="number" />
                    </FormControl>

                    <FormControl label="Retention (Days)" inputId="retentionDays" required>
                      <Field as={Input} name="retentionDays" id="retentionDays" type="number" />
                    </FormControl>

                    <FormControl label="Target Type" inputId="targetType">
                      <Field as={Select} name="targetType" id="targetType" options={[{ label: 'S3', value: 's3' }, { label: 'Local', value: 'local' }]} />
                    </FormControl>

                    <div className="form-group">
                      <div className="col-sm-12">
                        <LoadingButton
                          isLoading={isSubmitting}
                          loadingText="Saving..."
                          disabled={!isValid || !dirty}
                          className="btn-primary"
                          data-cy="backupSchedule-saveButton"
                        >
                          {isEdit ? 'Update' : 'Create'}
                        </LoadingButton>
                      </div>
                    </div>
                  </Form>
                )}
              </Formik>
            </Widget.Body>
          </Widget>
        </div>
      </div>
    </>
  );
}
