export function getAgentShortVersion(agentVersion) {
  const numbers = agentVersion.split('.');
  return numbers[0] + '-' + numbers[1];
}
