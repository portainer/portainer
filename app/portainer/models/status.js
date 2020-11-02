export function StatusViewModel(data) {
  this.Authentication = data.Authentication;
  this.Snapshot = data.Snapshot;
  this.Version = data.Version;
  this.Edition = data.Edition;
}

export function StatusVersionViewModel(data) {
  this.UpdateAvailable = data.UpdateAvailable;
  this.LatestVersion = data.LatestVersion;
}
