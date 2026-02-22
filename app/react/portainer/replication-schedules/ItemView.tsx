import { useRouter, useCurrentStateAndParams } from '@uirouter/react';
import { Formik, Form, Field } from 'formik';
import * as yup from 'yup';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';
import { Input } from '@@/form-components/Input';
import { FormControl } from '@@/form-components/FormControl';
import { SwitchField } from '@@/form-components/SwitchField';
import { useCreateReplicationSchedule, useUpdateReplicationSchedule, useReplicationSchedule } from './queries';
import { LoadingButton } from '@@/buttons/LoadingButton';

export function ReplicationScheduleItemView() {
  const router = useRouter();
  const { params } = useCurrentStateAndParams();
  const id = params.id;
  const isEdit = !!id;

  const query = useReplicationSchedule(id, { enabled: isEdit });
  const createMutation = useCreateReplicationSchedule();
  const updateMutation = useUpdateReplicationSchedule();

  const initialValues = isEdit && query.data ? {
    name: query.data.Name,
    schedule: query.data.Schedule,
    sourceId: query.data.SourceId,
    targetId: query.data.TargetId,
    failoverEnabled: query.data.FailoverSettings.Enabled,
    failoverTimeout: query.data.FailoverSettings.Timeout,
  } : {
    name: '',
    schedule: '0 0 * * *',
    sourceId: 1,
    targetId: 2,
    failoverEnabled: false,
    failoverTimeout: '5m',
  };

  const validationSchema = yup.object({
    name: yup.string().required('Name is required'),
    schedule: yup.string().required('Schedule is required'),
    sourceId: yup.number().required('Source is required'),
    targetId: yup.number().required('Target is required'),
  });

  async function handleSubmit(values: typeof initialValues) {
    const payload = {
      Name: values.name,
      Schedule: values.schedule,
      SourceId: Number(values.sourceId),
      TargetId: Number(values.targetId),
      FailoverSettings: {
        Enabled: values.failoverEnabled,
        Timeout: values.failoverTimeout,
        TargetPriorities: [],
      },
      Include: [],
      Exclude: [],
    };

    if (isEdit) {
      await updateMutation.mutateAsync({ id: Number(id), ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    router.stateService.go('portainer.replicationSchedules');
  }

  if (isEdit && query.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit Replication Schedule' : 'Create Replication Schedule'}
        breadcrumbs={[
          { label: 'Replication Schedules', link: 'portainer.replicationSchedules' },
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
                {({ isValid, dirty, isSubmitting, values, setFieldValue }) => (
                  <Form className="form-horizontal">
                    <FormControl label="Name" inputId="name" required>
                      <Field as={Input} name="name" id="name" />
                    </FormControl>

                    <FormControl label="Schedule (Cron)" inputId="schedule" required>
                      <Field as={Input} name="schedule" id="schedule" />
                    </FormControl>

                    <FormControl label="Source Endpoint ID" inputId="sourceId" required>
                      <Field as={Input} name="sourceId" id="sourceId" type="number" />
                    </FormControl>

                    <FormControl label="Target Endpoint ID" inputId="targetId" required>
                      <Field as={Input} name="targetId" id="targetId" type="number" />
                    </FormControl>

                    <FormControl label="Enable Failover" inputId="failoverEnabled">
                      <SwitchField
                        name="failoverEnabled"
                        checked={values.failoverEnabled}
                        onChange={(checked) => setFieldValue('failoverEnabled', checked)}
                        label="Enable Failover"
                        data-cy="replicationSchedule-failoverEnabled"
                      />
                    </FormControl>

                    {values.failoverEnabled && (
                      <FormControl label="Failover Timeout" inputId="failoverTimeout">
                        <Field as={Input} name="failoverTimeout" id="failoverTimeout" placeholder="e.g. 5m" />
                      </FormControl>
                    )}

                    <div className="form-group">
                      <div className="col-sm-12">
                        <LoadingButton
                          isLoading={isSubmitting}
                          loadingText="Saving..."
                          disabled={!isValid || !dirty}
                          className="btn-primary"
                          data-cy="replicationSchedule-saveButton"
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
