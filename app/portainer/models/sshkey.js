function SshkeyViewModel(data) {
    this.Id = data.ID;
    this.Name = data.Name;
    this.Privatekeypath = data.Privatekeypath;
    this.Publickeypath = data.Publickeypath;
    this.userName = data.userName;
    this.lastUsage = data.lastUsage;
  }
  