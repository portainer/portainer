import { Secret, Pod, PodSpec } from 'kubernetes-types/core/v1';
import { CronJob, Job } from 'kubernetes-types/batch/v1';

/**
 * getIsSecretInUse returns true if the secret is referenced by any pod, job, or cronjob in the same namespace
 */
export function getIsSecretInUse(
  secret: Secret,
  pods: Pod[],
  jobs: Job[],
  cronJobs: CronJob[]
) {
  // get all podspecs from pods, jobs and cronjobs that are in the same namespace
  const podsInNamespace = pods
    .filter((pod) => pod.metadata?.namespace === secret.metadata?.namespace)
    .map((pod) => pod.spec);
  const jobsInNamespace = jobs
    .filter((job) => job.metadata?.namespace === secret.metadata?.namespace)
    .map((job) => job.spec?.template.spec);
  const cronJobsInNamespace = cronJobs
    .filter(
      (cronJob) => cronJob.metadata?.namespace === secret.metadata?.namespace
    )
    .map((cronJob) => cronJob.spec?.jobTemplate.spec?.template.spec);
  const allPodSpecs = [
    ...podsInNamespace,
    ...jobsInNamespace,
    ...cronJobsInNamespace,
  ];

  // check if the secret is referenced by any pod, job or cronjob in the namespace
  const isReferenced = allPodSpecs.some((podSpec) => {
    if (!podSpec || !secret.metadata?.name) {
      return false;
    }
    return doesPodSpecReferenceSecret(podSpec, secret.metadata?.name);
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
