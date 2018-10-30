function ScheduleDefaultModel() {
  this.Name = '';
  this.Cron = '';
  this.Method = 'editor';
  this.Endpoints = [];
  this.Image = '';
  this.JobFileContent = '';
  this.JobFile = null;
}

// TODO: remove
function ScheduleDefaultMock() {
  this.Id = 1;
  this.Name = 'myschedule01';
  this.Cron = '30 1 * * *';
  this.Method = 'editor';
  this.Image = 'ubuntu:latest';
  this.Endpoints = [1];
  this.JobFileContent = 'ls -lah /host/tmp';
  this.JobFile = null;
  this.Created = moment();
}
