export function ScheduleCreateRequest(model) {
  this.Name = model.Name;
  this.Recurring = model.Recurring;
  this.CronExpression = model.CronExpression;
  this.Endpoints = model.Endpoints;
  this.FileContent = model.FileContent;
  this.File = model.File;
}

export function ScheduleUpdateRequest(model) {
  this.id = model.Id;
  this.Name = model.Name;
  this.Recurring = model.Recurring;
  this.CronExpression = model.CronExpression;
  this.Endpoints = model.Endpoints;
  this.FileContent = model.FileContent;
}
