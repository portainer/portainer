function StackViewModel(data) {
  this.Id = data.Id;
  this.Name = data.Name;
  this.Checked = false;
  if (data.ResourceControl && data.ResourceControl.Id !== 0) {
    this.ResourceControl = new ResourceControlViewModel(data.ResourceControl);
  }
  this.External = data.External;
}
