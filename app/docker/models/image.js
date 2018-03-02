function ImageViewModel(data) {
  this.Id = data.Id;
  this.Tag = data.Tag;
  this.Repository = data.Repository;
  this.Created = data.Created;
  this.Checked = false;
  this.RepoTags = data.RepoTags;
  this.VirtualSize = data.VirtualSize;
  this.ContainerCount = data.ContainerCount;
}

function ImageBuildModel(data) {
  this.hasError = false;
  var buildLogs = [];

  for (var i = 0; i < data.length; i++) {
    var line = data[i];

    if (line.stream) {
      line = line.stream.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
      buildLogs.push(line);
    }

    if (line.errorDetail) {
      buildLogs.push(line.errorDetail.message);
      this.hasError = true;
    }
  }

  this.buildLogs = buildLogs;
}
