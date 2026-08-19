import _ from 'lodash-es';

export function TagViewModel(data) {
  this.Id = data.ID;
  this.Name = _.escape(data.Name);
}
