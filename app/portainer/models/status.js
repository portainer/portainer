export function StatusViewModel(data) {
  this.Authentication = data.Authentication;
  this.Snapshot = data.Snapshot;
  this.EndpointManagement = data.EndpointManagement;
  this.Analytics = data.Analytics;
  this.Version = data.Version;
}

export function StatusVersionViewModel(data) {
  this.UpdateAvailable = data.UpdateAvailable;
  this.LatestVersion = data.LatestVersion;
}