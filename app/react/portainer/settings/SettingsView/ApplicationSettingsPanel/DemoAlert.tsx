import { useIsDemo } from '@/react/portainer/system/useSystemStatus';

export function DemoAlert() {
  const isDemoQuery = useIsDemo();
  if (!isDemoQuery.data) {
    return null;
  }

  return (
    <div className="col-sm-12 mt-2">
      <span className="small text-muted">
        You cannot use this feature in the demo version of Portainer.
      </span>
    </div>
  );
}
