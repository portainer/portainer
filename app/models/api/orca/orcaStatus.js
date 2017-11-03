function OrcaStatusViewModel(data) {
  if (data) {
      if (data.Name) {
        this.Name = data.Name;
      } else {
        this.Name = "";
      }
      if (data.Messages) {
        this.Messages = data.Messages;
      } else {
        this.Messages = "No messages";
      }
      if (data.Errors) {
        this.Errors = data.Errors;
      } else {
        this.Errors = "No errors";
      }
  } else {
    this.Name = ""
    this.Messages = "No messages";
    this.Errors = "No errors";
  }
}
