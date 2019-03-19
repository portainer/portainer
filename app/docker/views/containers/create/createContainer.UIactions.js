export function addVolume() {
  this.formValues.Volumes.push({ name: '', containerPath: '', readOnly: false, type: 'volume' });
}

export function removeVolume(index) {
  this.formValues.Volumes.splice(index, 1);
}

export function addEnvironmentVariable() {
  this.config.Env.push({ name: '', value: ''});
}

export function removeEnvironmentVariable(index) {
  this.config.Env.splice(index, 1);
}

export function addPortBinding() {
  this.config.HostConfig.PortBindings.push({ hostPort: '', containerPort: '', protocol: 'tcp' });
}

export function removePortBinding(index) {
  this.config.HostConfig.PortBindings.splice(index, 1);
}

export function addLabel() {
  this.formValues.Labels.push({ name: '', value: ''});
}

export function removeLabel(index) {
  this.formValues.Labels.splice(index, 1);
}

export function addExtraHost() {
  this.formValues.ExtraHosts.push({ value: '' });
}

export function removeExtraHost(index) {
  this.formValues.ExtraHosts.splice(index, 1);
}

export function addDevice() {
  this.config.HostConfig.Devices.push({ pathOnHost: '', pathInContainer: '' });
}

export function removeDevice(index) {
  this.config.HostConfig.Devices.splice(index, 1);
}

export function addLogDriverOpt() {
  this.formValues.LogDriverOpts.push({ name: '', value: ''});
}

export function removeLogDriverOpt(index) {
  this.formValues.LogDriverOpts.splice(index, 1);
}