import _ from 'lodash-es';
import {createStatus} from '../../docker/models/container';

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

// TODO: endpoint mix for Edge implementation
export function ScheduleModel(data) {
  this.Id = data.Id;
  this.Name = data.Name;
  this.Recurring = data.Recurring;
  this.JobType = data.JobType;
  this.CronExpression = data.CronExpression;
  this.Created = data.Created;
  this.EdgeSchedule = data.EdgeSchedule;
  if (this.JobType === 1) {
    this.Job = new ScriptExecutionJobModel(data.ScriptExecutionJob, data.EdgeSchedule.Endpoints);
  }
}

function ScriptExecutionJobModel(data, edgeEndpoints) {
  this.Image = data.Image;
  this.Endpoints = _.concat(data.Endpoints, edgeEndpoints);
  this.FileContent = '';
  this.Method = 'editor';
  this.RetryCount = data.RetryCount;
  this.RetryInterval = data.RetryInterval;
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
  this.Image = model.Job.Image;
  this.Endpoints = model.Job.Endpoints;
  this.FileContent = model.Job.FileContent;
  this.RetryCount = model.Job.RetryCount;
  this.RetryInterval = model.Job.RetryInterval;
  this.File = model.Job.File;
}

export function ScheduleUpdateRequest(model) {
  this.id = model.Id;
  this.Name = model.Name;
  this.Recurring = model.Recurring;
  this.CronExpression = model.CronExpression;
  this.Image = model.Job.Image;
  this.Endpoints = model.Job.Endpoints;
  this.FileContent = model.Job.FileContent;
  this.RetryCount = model.Job.RetryCount;
  this.RetryInterval = model.Job.RetryInterval;
}
