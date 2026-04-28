import type { Environment } from '@/react/portainer/environments/types';

export function EnvironmentURL({ environment }: { environment: Environment }) {
  return (
    <span className="small text-muted vertical-center">{environment.URL}</span>
  );
}
