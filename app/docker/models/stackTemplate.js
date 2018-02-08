function StackTemplateViewModel(data) {
  this.Type = data.type;
  this.Title = data.title;
  this.Description = data.description;
  this.Note = data.note;
  this.Categories = data.categories ? data.categories : [];
  this.Platform = data.platform ? data.platform : 'undefined';
  this.Logo = data.logo;
  this.Repository = data.repository;
  this.Env = data.env ? data.env : [];
}
