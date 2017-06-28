function StackViewModel(data) {
  this.Id = data.Id;
  this.Name = data.Name;
  this.Checked = false;

  // This data is merged from the stack discovery
  this.ServiceCount = 0;
  this.Status = 'down';
}
