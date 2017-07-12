function ImageViewModel(data) {
  this.Id = data.Id;
  this.Tag = data.Tag;
  this.Repository = data.Repository;
  this.Created = data.Created;
  this.Containers = data.dataUsage ? data.dataUsage.Containers : 0;
  this.Checked = false;
  this.RepoTags = data.RepoTags;
  this.VirtualSize = data.VirtualSize;
}
