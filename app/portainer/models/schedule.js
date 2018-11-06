function ScheduleDefaultModel() {
  this.Name = '';
  this.Image = '';
  this.CronExpression = '';
  this.Endpoints = [];
  this.FileContent = '';
  this.File = null;
  this.Method = 'editor';
}

// function ScheduleDefaultModel() {
//   this.Name = 'test01';
//   this.Image = 'ubuntu:latest';
//   this.CronExpression = '@every 2m';
//   this.Endpoints = [1];
//   this.FileContent = 'echo "ouimonsieur >> /host/tmp/toto"';
//   this.File = null;
//   this.Method = 'editor';
// }


function ScheduleModel(data) {
  this.Id = data.Id;
  this.Name = data.Name;
  this.Image = '';
  this.CronExpression = data.CronExpression;
  this.Endpoints = [];
  this.FileContent = '';
  this.File = null;
}

// function ScheduleCreateRequest(model) {
//   this.Name = model.Name;
//
//   this.Name = model.Name;
//   this.Description = model.Description;
//   this.Tags = model.Tags;
//   this.AssociatedEndpoints = endpoints;
// }
