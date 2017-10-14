function AnonymousStackViewModel(data) {
  this.Name = data.Name;
  this.Deployment = data.Deployment;
  this.ServiceCount = data.ServiceCount;
  this.Status = data.ServiceCount > 0 ? 'up' : 'down';
  this.Checked = false;
}
