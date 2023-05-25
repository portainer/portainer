import { Zap } from 'lucide-react';

import {
  Environment,
  EnvironmentType,
} from '@/react/portainer/environments/types';
import {
  isEdgeEnvironment,
  isLocalEnvironment,
  isAgentEnvironment,
} from '@/react/portainer/environments/utils';

export function EnvironmentTypeTag({
  environment,
}: {
  environment: Environment;
}) {
  const typeLabel = getTypeLabel(environment);

  if (!typeLabel) {
    return null;
  }

  return (
    <span className="vertical-center gap-1">
      <Zap className="icon icon-xs vertical-center" aria-hidden="true" />

      <span>{typeLabel}</span>
    </span>
  );
}

function getTypeLabel(environment: Environment) {
  if (isEdgeEnvironment(environment.Type)) {
    return environment.Edge.AsyncMode
      ? 'Edge Agent Async'
      : 'Edge Agent Standard';
  }

  if (isLocalEnvironment(environment)) {
    return 'Local';
  }

  if (environment.Type === EnvironmentType.Azure) {
    return 'ACI';
  }

  if (isAgentEnvironment(environment.Type)) {
    return 'Agent';
  }

  return '';
}
