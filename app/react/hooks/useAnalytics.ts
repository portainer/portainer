import { trackEvent } from '@/angulartics.matomo/analytics-services';
import { usePublicSettings } from '@/react/portainer/settings/queries';

export function useAnalytics() {
  const telemetryQuery = usePublicSettings({
    select: (settings) => settings.EnableTelemetry,
  });

  return { trackEvent: handleTrackEvent };

  function handleTrackEvent(...args: Parameters<typeof trackEvent>) {
    if (telemetryQuery.data) {
      trackEvent(...args);
    }
  }
}
