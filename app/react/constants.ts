export const STACK_NAME_VALIDATION_REGEX = '^[-_a-z0-9]+$';

export const BROWSER_OS_PLATFORM = getOs();

function getOs() {
  const { userAgent } = navigator;

  if (userAgent.includes('Windows')) {
    return 'win';
  }

  return userAgent.includes('Mac') ? 'mac' : 'lin';
}

export const COMPOSE_STACK_NAME_LABEL = 'com.docker.compose.project';
export const SWARM_STACK_NAME_LABEL = 'com.docker.stack.namespace';
