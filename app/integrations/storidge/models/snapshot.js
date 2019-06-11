export function StoridgeSnapshotModel(data) {
  this.Id = data.identifier;
  this.Date = data.date;
  this.Description = data.description;
  this.SourceID = data.sourceid;
  this.Type = data.type;
  this.Directory = data.directory;
  this.Source = data.source;
}
