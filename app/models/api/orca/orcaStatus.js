function OrcaStatusViewModel(data) {
  if (data) {
      if (data.Name) {
        this.Name = data.Name;
      } else {
        this.Name = "";
      }
      if (data.Messages == "") {
        this.Messages = "No messages";
      } else {
        this.Messages = data.Messages;
      }
      if (data.Errors == "") {
        this.Errors = "No errors";
      } else {
        this.Errors = data.Errors;
      }
  } else {
    this.Name = ""
    this.Messages = "No messages";
    this.Errors = "No errors";
  }
}
