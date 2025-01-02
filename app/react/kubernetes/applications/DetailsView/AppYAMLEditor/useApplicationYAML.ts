import { useCurrentStateAndParams } from '@uirouter/react';
import { useMemo } from 'react';

import { useServicesQuery } from '@/react/kubernetes/services/service';

import { useHorizontalPodAutoScaler } from '../../queries/useHorizontalPodAutoScaler';
import { useApplication } from '../../queries/useApplication';
import { useApplicationServices } from '../../queries/useApplicationServices';
import { useApplicationHorizontalPodAutoscaler } from '../../queries/useApplicationHorizontalPodAutoscaler';

export function useApplicationYAML() {
  const {
    params: {
      namespace,
      name,
      'resource-type': resourceType,
      endpointId: environmentId,
    },
  } = useCurrentStateAndParams();
  // find the application and the yaml for it
  const { data: application, ...applicationQuery } = useApplication(
    environmentId,
    namespace,
    name,
    resourceType
  );
  const { data: applicationYAML, ...applicationYAMLQuery } =
    useApplication<string>(environmentId, namespace, name, resourceType, {
      yaml: true,
    });

  // find the matching services, then get the yaml for them
  const { data: services, ...servicesQuery } = useApplicationServices(
    environmentId,
    namespace,
    name,
    application
  );
  const serviceNames =
    services?.flatMap((service) => service.metadata?.name || []) || [];
  const { data: servicesYAML, ...servicesYAMLQuery } = useServicesQuery<string>(
    environmentId,
    namespace,
    serviceNames,
    { yaml: true }
  );

  // find the matching autoscalar, then get the yaml for it
  const { data: autoScalar, ...autoScalarsQuery } =
    useApplicationHorizontalPodAutoscaler(
      environmentId,
      namespace,
      name,
      application
    );
  const { data: autoScalarYAML, ...autoScalarYAMLQuery } =
    useHorizontalPodAutoScaler<string>(
      environmentId,
      namespace,
      autoScalar?.metadata?.name || '',
      { yaml: true }
    );

  const fullApplicationYaml = useMemo(() => {
    const yamlArray = [
      applicationYAML,
      ...(servicesYAML || []),
      autoScalarYAML,
    ].flatMap((yaml) => yaml || []);

    const yamlString = yamlArray.join('\n---\n');
    return yamlString;
  }, [applicationYAML, autoScalarYAML, servicesYAML]);

  const isApplicationYAMLLoading =
    applicationQuery.isInitialLoading ||
    servicesQuery.isInitialLoading ||
    autoScalarsQuery.isInitialLoading ||
    applicationYAMLQuery.isInitialLoading ||
    servicesYAMLQuery.isInitialLoading ||
    autoScalarYAMLQuery.isInitialLoading;

  return { fullApplicationYaml, isApplicationYAMLLoading };
}
