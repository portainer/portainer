import { Formik, Form } from 'formik';
import { X, CheckSquare } from 'lucide-react';
import { useRouter } from '@uirouter/react';

import { ServiceViewModel } from '@/docker/models/service';
import { useUpdateServiceMutation } from '@/react/docker/services/queries/useUpdateServiceMutation';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { convertServiceToConfig } from '@/react/docker/services/common/convertServiceToConfig';
import { notifySuccess } from '@/portainer/services/notifications';

import { Button, LoadingButton } from '@@/buttons';

export function ScaleForm({
  onClose,
  service,
}: {
  onClose: () => void;
  service: ServiceViewModel;
}) {
  const environmentId = useEnvironmentId();
  const mutation = useUpdateServiceMutation(environmentId);
  const router = useRouter();
  return (
    <Formik
      initialValues={{ replicas: service.Replicas || 0 }}
      onSubmit={handleSubmit}
    >
      {({ values, setFieldValue }) => (
        <Form>
          <input
            className="input-sm w-20"
            type="number"
            min={0}
            step={1}
            value={Number.isNaN(values.replicas) ? '' : values.replicas}
            onKeyUp={(event) => {
              if (event.key === 'Escape') {
                onClose();
              }
            }}
            onChange={(event) => {
              setFieldValue('replicas', event.target.valueAsNumber);
            }}
            // disabled because it makes sense to auto focus once the form is mounted
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
          <Button
            color="none"
            icon={X}
            onClick={() => onClose()}
            data-cy={`scale-service-cancel-button-${service.Name}`}
          />
          <LoadingButton
            isLoading={mutation.isLoading}
            data-cy={`scale-service-submit-button-${service.Name}`}
            disabled={
              values.replicas === service.Replicas ||
              values.replicas < 0 ||
              Number.isNaN(values.replicas)
            }
            loadingText="Scaling..."
            color="none"
            icon={CheckSquare}
            type="submit"
          />
        </Form>
      )}
    </Formik>
  );

  function handleSubmit({ replicas }: { replicas: number }) {
    const config = convertServiceToConfig(service.Model);
    mutation.mutate(
      {
        serviceId: service.Id,
        config: {
          ...config,
          Mode: {
            ...config.Mode,
            Replicated: {
              ...config.Mode?.Replicated,
              Replicas: replicas,
            },
          },
        },
        environmentId,
        version: service.Version || 0,
      },
      {
        onSuccess() {
          onClose();
          notifySuccess(
            'Service successfully scaled',
            `New replica count: ${replicas}`
          );
          router.stateService.reload();
        },
      }
    );
  }
}
