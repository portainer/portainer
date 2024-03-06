import { Field, useFormikContext } from 'formik';
import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

import { useGetMetricsMutation } from '@/react/kubernetes/queries/useGetMetricsMutation';

import { TextTip } from '@@/Tip/TextTip';
import { FormControl } from '@@/form-components/FormControl';
import { Switch } from '@@/form-components/SwitchField/Switch';
import { InlineLoader } from '@@/InlineLoader';

import { ConfigureFormValues } from './types';

type Props = {
  environmentId: number;
  value: boolean;
  error?: string;
};

export function EnableMetricsInput({ value, error, environmentId }: Props) {
  const { setFieldValue } = useFormikContext<ConfigureFormValues>();
  const [metricsFound, setMetricsFound] = useState<boolean>();
  const getMetricsMutation = useGetMetricsMutation();
  return (
    <div className="mb-4">
      <TextTip color="blue">
        <p>
          Enabling the metrics feature allows users to use horizontal pod
          autoscaling and to see container and node resource usage. This
          requires{' '}
          <a
            href="https://kubernetes.io/docs/tasks/debug-application-cluster/resource-metrics-pipeline/#metrics-server"
            target="_blank"
            rel="noreferrer"
          >
            metrics server
          </a>{' '}
          or{' '}
          <a
            href="https://github.com/kubernetes-sigs/prometheus-adapter"
            target="_blank"
            rel="noreferrer"
          >
            prometheus
          </a>{' '}
          to be running in your cluster.
        </p>
        <p>
          On any subsequent disabling of the feature, existing deployed
          applications with autoscaling will still autoscale (you would have to
          remove their autoscaler definitions to stop this).
        </p>
      </TextTip>
      <FormControl
        label="Enable features using the metrics API"
        className="mb-0"
        size="large"
        errors={error}
        inputId="kubeSetup-metricsToggle"
      >
        <Field
          name="useServerMetrics"
          as={Switch}
          checked={value}
          id="kubeSetup-metricsToggle"
          onChange={(checked: boolean) => {
            // if turning off, just set the value
            if (!checked) {
              setFieldValue('useServerMetrics', checked);
              return;
            }
            // if turning on, see if the metrics server is available, then set the value to on if it is
            getMetricsMutation.mutate(environmentId, {
              onSuccess: () => {
                setMetricsFound(true);
                setFieldValue('useServerMetrics', checked);
              },
              onError: () => {
                setMetricsFound(false);
              },
            });
          }}
          data-cy="kubeSetup-metricsToggle"
        />
      </FormControl>
      {getMetricsMutation.isLoading && (
        <InlineLoader size="sm">Checking metrics API...</InlineLoader>
      )}
      {!getMetricsMutation.isLoading && (
        <>
          {metricsFound === false && (
            <TextTip color="red" icon={XCircle}>
              Unable to reach metrics API, make sure metrics server is properly
              deployed inside that cluster.
            </TextTip>
          )}
          {metricsFound === true && (
            <TextTip color="green" icon={CheckCircle}>
              Successfully reached metrics API
            </TextTip>
          )}
        </>
      )}
    </div>
  );
}
