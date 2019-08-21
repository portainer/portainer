export function RegistryRepositoryViewModel(data) {
  this.Name = data.name;
  this.TagsCount = data.tags.length;
}

export function RegistryRepositoryGitlabViewModel(data) {
  this.Id = data.id;
  this.Name = data.path;
  this.TagsCount = data.tags.length;
}