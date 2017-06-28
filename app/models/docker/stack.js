function AnonymousStackViewModel(data) {
  this.Name = data.Name;
  this.Type = data.Type;
  this.ServiceCount = data.ServiceCount;
  this.Status = data.ServiceCount > 0 ? 'up' : 'down';
  this.Checked = false;
}
