import { createStatus } from '../../docker/models/container';

export function ScheduleDefaultModel() {
  this.Name = '';
  this.Recurring = false;
  this.CronExpression = '';
  this.JobType = 1;
  this.Job = new ScriptExecutionDefaultJobModel();
}

function ScriptExecutionDefaultJobModel() {
  this.Image = 'ubuntu:latest';
  this.Endpoints = [];
  this.FileContent = '';
  this.File = null;
  this.Method = 'editor';
}

export function ScriptExecutionTaskModel(data) {
  this.Id = data.Id;
  this.EndpointId = data.EndpointId;
  this.Status = createStatus(data.Status);
  this.Created = data.Created;
  this.Edge = data.Edge;
}

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
