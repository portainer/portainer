import { PodSpec } from 'kubernetes-types/core/v1';

import { Configuration } from '../../types';
import { Job, CronJob, K8sPod } from '../../../applications/types';

/**
 * getIsSecretInUse returns true if the secret is referenced by any pod, job, or cronjob in the same namespace
 */
export function getIsSecretInUse(
  secret: Configuration,
  pods: K8sPod[],
  jobs: Job[],
  cronJobs: CronJob[]
) {
  // get all podspecs from pods, jobs and cronjobs that are in the same namespace
  const podsInNamespace = pods.filter(
    (pod) => pod.namespace === secret.Namespace
  );
  const jobsInNamespace = jobs.filter(
    (job) => job.namespace === secret.Namespace
  );
  const cronJobsInNamespace = cronJobs.filter(
    (cronJob) => cronJob.namespace === secret.Namespace
  );
  const allPodSpecs = [
    ...podsInNamespace,
    ...jobsInNamespace,
    ...cronJobsInNamespace,
  ];

  // check if the secret is referenced by any pod, job or cronjob in the namespace
  const isReferenced = allPodSpecs.some((podSpec) => {
    if (!podSpec || !secret.Name) {
      return false;
    }
    return doesPodSpecReferenceSecret(podSpec, secret.Name);
  });

  return isReferenced;
}

/**
 * Checks if a PodSpec references a specific Secret.
 * @param podSpec - The PodSpec object to check.
 * @param secretName - The name of the Secret to check for references.
 * @returns A boolean indicating whether the PodSpec references the Secret.
 */
function doesPodSpecReferenceSecret(podSpec: PodSpec, secretName: string) {
  const hasEnvVarReference = podSpec?.containers.some((container) => {
    const valueFromEnv = container.env?.some(
      (envVar) => envVar.valueFrom?.secretKeyRef?.name === secretName
    );
    const envFromEnv = container.envFrom?.some(
      (envVar) => envVar.secretRef?.name === secretName
    );
    return valueFromEnv || envFromEnv;
  });

  const hasVolumeReference = podSpec?.volumes?.some(
    (volume) => volume.secret?.secretName === secretName
  );

  return hasEnvVarReference || hasVolumeReference;
}
