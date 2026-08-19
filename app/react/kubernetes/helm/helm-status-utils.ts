export enum DeploymentStatus {
  DEPLOYED = 'deployed',
  FAILED = 'failed',
  PENDING = 'pending-install',
  PENDINGUPGRADE = 'pending-upgrade',
  PENDINGROLLBACK = 'pending-rollback',
  SUPERSEDED = 'superseded',
  UNINSTALLED = 'uninstalled',
  UNINSTALLING = 'uninstalling',
}

export function getStatusColor(status?: string) {
  switch (status?.toLowerCase()) {
    case DeploymentStatus.DEPLOYED:
      return 'success';
    case DeploymentStatus.FAILED:
      return 'danger';
    case DeploymentStatus.PENDING:
    case DeploymentStatus.PENDINGUPGRADE:
    case DeploymentStatus.PENDINGROLLBACK:
    case DeploymentStatus.UNINSTALLING:
      return 'warn';
    case DeploymentStatus.SUPERSEDED:
    default:
      return 'muted';
  }
}

export function getStatusText(status?: string) {
  switch (status?.toLowerCase()) {
    case DeploymentStatus.DEPLOYED:
      return 'Deployed';
    case DeploymentStatus.FAILED:
      return 'Failed';
    case DeploymentStatus.PENDING:
      return 'Pending install';
    case DeploymentStatus.PENDINGUPGRADE:
      return 'Pending upgrade';
    case DeploymentStatus.PENDINGROLLBACK:
      return 'Pending rollback';
    case DeploymentStatus.UNINSTALLING:
      return 'Uninstalling';
    case DeploymentStatus.SUPERSEDED:
      return 'Superseded';
    default:
      return 'Unknown';
  }
}
