function OperationViewModel(data) {
  if (data.Name == "") {
    this.Name = "No active operations"
  } else {
    this.Name = data.Name;
  }
}
