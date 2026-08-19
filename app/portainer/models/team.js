import _ from 'lodash-es';

export function TeamViewModel(data) {
  this.Id = data.Id;
  this.Name = _.escape(data.Name);
  this.Checked = false;
}
