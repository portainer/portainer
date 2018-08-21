/* exported StoridgeNodeModel */

function StoridgeNodeModel(name, data) {
  this.Name = name;
  this.IP = data.ip;
  this.Role = data.role;
  this.Status = data.status;
}
