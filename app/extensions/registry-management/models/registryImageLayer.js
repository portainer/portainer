import _ from 'lodash-es';

export function RegistryImageLayerViewModel(order, data) {
  this.Order = order;
  this.Id = data.id;
  this.Created = data.created;
  this.CreatedBy = _.join(data.container_config.Cmd, ' ');
}