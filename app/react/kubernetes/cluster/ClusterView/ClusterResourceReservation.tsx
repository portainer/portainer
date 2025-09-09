import { Widget, WidgetBody } from '@/react/components/Widget';
import { ResourceReservation } from '@/react/kubernetes/components/ResourceReservation';

import { useClusterResourceReservationData } from './useClusterResourceReservationData';

export function ClusterResourceReservation() {
  // Load all data required for this component
  const {
    cpuLimit,
    memoryLimit,
    isLoading,
    displayResourceUsage,
    resourceUsage,
    resourceReservation,
    displayWarning,
  } = useClusterResourceReservationData();

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <WidgetBody>
            <ResourceReservation
              isLoading={isLoading}
              displayResourceUsage={displayResourceUsage}
              resourceReservation={resourceReservation}
              resourceUsage={resourceUsage}
              cpuLimit={cpuLimit}
              memoryLimit={memoryLimit}
              memoryUnit="MiB"
              description="Resource reservation represents the total amount of resource assigned to all the applications inside the cluster."
              displayWarning={displayWarning}
              warningMessage="Resource usage is not currently available as Metrics Server is not responding. If you've recently upgraded, Metrics Server may take a while to restart, so please check back shortly."
            />
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
