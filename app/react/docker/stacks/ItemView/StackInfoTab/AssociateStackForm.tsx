import { RefreshCw } from 'lucide-react';
import { Form, Formik, useFormikContext } from 'formik';
import { object } from 'yup';
import { useRouter } from '@uirouter/react';

import { AccessControlForm } from '@/react/portainer/access-control';
import { AccessControlFormData } from '@/react/portainer/access-control/types';
import { parseAccessControlFormData } from '@/react/portainer/access-control/utils';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { validationSchema as accessControlValidation } from '@/react/portainer/access-control/AccessControlForm/AccessControlForm.validation';
import { useSwarmId } from '@/react/docker/proxy/queries/useSwarm';
import { notifySuccess } from '@/portainer/services/notifications';

import { LoadingButton } from '@@/buttons';
import { FormSection } from '@@/form-components/FormSection';

import { useAssociateStackToEnvironmentMutation } from './useAssociateStackToEnvironmentMutation';

function validationSchema({ isAdmin }: { isAdmin: boolean }) {
  return object({
    accessControl: accessControlValidation(isAdmin),
  });
}

export function AssociateStackForm({
  stackName,
  environmentId,
  stackId,
  isOrphanedRunning,
}: {
  stackName: string;
  environmentId: EnvironmentId;
  stackId: number;
  isOrphanedRunning: boolean | undefined;
}) {
  const router = useRouter();
  const swarmIdQuery = useSwarmId(environmentId);
  const mutation = useAssociateStackToEnvironmentMutation();

  const { user } = useCurrentUser();
  const { isAdmin } = useIsEdgeAdmin();
  const initialValues: FormValues = {
    accessControl: parseAccessControlFormData(isAdmin, user.Id),
  };

  return (
    <FormSection title="Associate to this environment">
      <p className="small text-muted">
        This feature allows you to re-associate this stack to the current
        environment.
      </p>

      <Formik
        initialValues={initialValues}
        onSubmit={(values) => {
          mutation.mutate(
            {
              environmentId,
              accessControl: values.accessControl,
              swarmId: swarmIdQuery.data,
              isOrphanedRunning,
              stackId,
            },
            {
              onSuccess() {
                notifySuccess('Stack successfully associated', stackName);
                router.stateService.go('docker.stacks');
              },
            }
          );
        }}
        validateOnMount
        validationSchema={() => validationSchema({ isAdmin })}
      >
        <InnerForm environmentId={environmentId} />
      </Formik>
    </FormSection>
  );
}
type FormValues = {
  accessControl: AccessControlFormData;
};

function InnerForm({ environmentId }: { environmentId: EnvironmentId }) {
  const { values, setFieldValue, errors, isSubmitting } =
    useFormikContext<FormValues>();

  return (
    <Form className="form-horizontal">
      <AccessControlForm
        values={values.accessControl}
        onChange={(newValues) => setFieldValue('accessControl', newValues)}
        hideTitle
        environmentId={environmentId}
        errors={errors.accessControl}
      />
      <div className="form-group">
        <div className="col-sm-12">
          <LoadingButton
            color="primary"
            size="small"
            isLoading={isSubmitting}
            loadingText="Association in progress..."
            icon={RefreshCw}
            className="-ml-1.25"
            data-cy="stack-associate-btn"
          >
            Associate
          </LoadingButton>
        </div>
      </div>
    </Form>
  );
}
