import { Move } from 'lucide-react';

import { EnvironmentId } from '@/react/portainer/environments/types';

import { Icon } from '@@/Icon';
import { TextTip } from '@@/Tip/TextTip';
import { Tooltip } from '@@/Tip/Tooltip';

import { Application } from '../../types';
import { useApplicationHorizontalPodAutoscalers } from '../../application.queries';

type Props = {
  environmentId: EnvironmentId;
  namespace: string;
  appName: string;
  app?: Application;
};

export function ApplicationAutoScalingTable({
  environmentId,
  namespace,
  appName,
  app,
}: Props) {
  const { data: appAutoScalar } = useApplicationHorizontalPodAutoscalers(
    environmentId,
    namespace,
    appName,
    app
  );

  return (
    <>
      <div className="text-muted mb-4 flex items-center">
        <Icon icon={Move} className="!mr-2" />
        Auto-scaling
      </div>
      {!appAutoScalar && (
        <TextTip color="blue">
          This application does not have an autoscaling policy defined.
        </TextTip>
      )}
      {appAutoScalar && (
        <div className="mt-4 w-3/5">
          <table className="table">
            <tbody>
              <tr className="text-muted">
                <td className="w-1/3">Minimum instances</td>
                <td className="w-1/3">Maximum instances</td>
                <td className="w-1/3">
                  <div className="flex min-w-max items-center gap-1">
                    Target CPU usage
                    <Tooltip message="The autoscaler will ensure enough instances are running to maintain an average CPU usage across all instances." />
                  </div>
                </td>
              </tr>
              <tr>
                <td data-cy="k8sAppDetail-minReplicas">
                  {appAutoScalar.spec?.minReplicas}
                </td>
                <td data-cy="k8sAppDetail-maxReplicas">
                  {appAutoScalar.spec?.maxReplicas}
                </td>
                <td data-cy="k8sAppDetail-targetCPU">
                  {appAutoScalar.spec?.targetCPUUtilizationPercentage}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
