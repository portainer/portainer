import { ConfigMap, Pod, PodSpec } from 'kubernetes-types/core/v1';
import { CronJob, Job } from 'kubernetes-types/batch/v1';

/**
 * getIsConfigMapInUse returns true if the configmap is referenced by any pod, job, or cronjob in the same namespace
 */
export function getIsConfigMapInUse(
  configMap: ConfigMap,
  pods: Pod[],
  jobs: Job[],
  cronJobs: CronJob[]
) {
  // get all podspecs from pods, jobs and cronjobs that are in the same namespace
  const podsInNamespace = pods
    .filter((pod) => pod.metadata?.namespace === configMap.metadata?.namespace)
    .map((pod) => pod.spec);
  const jobsInNamespace = jobs
    .filter((job) => job.metadata?.namespace === configMap.metadata?.namespace)
    .map((job) => job.spec?.template.spec);
  const cronJobsInNamespace = cronJobs
    .filter(
      (cronJob) => cronJob.metadata?.namespace === configMap.metadata?.namespace
    )
    .map((cronJob) => cronJob.spec?.jobTemplate.spec?.template.spec);
  const allPodSpecs = [
    ...podsInNamespace,
    ...jobsInNamespace,
    ...cronJobsInNamespace,
  ];

  // check if the configmap is referenced by any pod, job or cronjob in the namespace
  const isReferenced = allPodSpecs.some((podSpec) => {
    if (!podSpec || !configMap.metadata?.name) {
      return false;
    }
    return doesPodSpecReferenceConfigMap(podSpec, configMap.metadata?.name);
  });

  return isReferenced;
}

/**
 * Checks if a PodSpec references a specific ConfigMap.
 * @param podSpec - The PodSpec object to check.
 * @param configmapName - The name of the ConfigMap to check for references.
 * @returns A boolean indicating whether the PodSpec references the ConfigMap.
 */
function doesPodSpecReferenceConfigMap(
  podSpec: PodSpec,
  configmapName: string
) {
  const hasEnvVarReference = podSpec?.containers.some((container) => {
    const valueFromEnv = container.env?.some(
      (envVar) => envVar.valueFrom?.configMapKeyRef?.name === configmapName
    );
    const envFromEnv = container.envFrom?.some(
      (envVar) => envVar.configMapRef?.name === configmapName
    );
    return valueFromEnv || envFromEnv;
  });

  const hasVolumeReference = podSpec?.volumes?.some(
    (volume) => volume.configMap?.name === configmapName
  );

  return hasEnvVarReference || hasVolumeReference;
}
