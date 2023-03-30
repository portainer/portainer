import { InsightsBox } from '@@/InsightsBox';

export function GpusInsights() {
  return (
    <InsightsBox
      content={
        <>
          <p>
            From 2.18 on, the set-up of available GPUs for a Docker Standalone
            environment has been shifted from Add environment and Environment
            details to Host -&gt; Setup, so as to align with other settings.
          </p>
          <p>
            A toggle has been introduced for enabling/disabling management of
            GPU settings in the Portainer UI - to alleviate the performance
            impact of showing those settings.
          </p>
          <p>
            The UI has been updated to clarify that GPU settings support is only
            for Docker Standalone (and not Docker Swarm, which was never
            supported in the UI).
          </p>
        </>
      }
      header="GPU settings update"
      insightCloseId="gpu-settings-update-closed"
    />
  );
}
