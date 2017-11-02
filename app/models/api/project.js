function ProjectViewModel(data) {
  this.Id = data.Name;
  this.Name = data.Name;

  if (data.Release) {
    this.Release = data.Release
  } else {
    this.Release = "Unknown"
  }

  this.Checked = false;
  if (data.ResourceControl && data.ResourceControl.Id !== 0) {
    this.ResourceControl = new ResourceControlViewModel(data.ResourceControl);
  }
  this.External = data.External;
}
