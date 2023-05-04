import * as notifications from '@/portainer/services/notifications';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { Job } from '@/react/nomad/types';
import { deleteJob } from '@/react/nomad/jobs/jobs.service';

export async function deleteJobs(environmentID: EnvironmentId, jobs: Job[]) {
  return Promise.all(
    jobs.map(async (job) => {
      try {
        await deleteJob(environmentID, job.ID, job.Namespace);
        notifications.success('Job successfully removed', job.ID);
      } catch (err) {
        notifications.error(
          'Failure',
          err as Error,
          `Failed to delete job ${job.ID}`
        );
      }
    })
  );
}
