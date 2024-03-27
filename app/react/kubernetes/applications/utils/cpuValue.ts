import _ from 'lodash';

export function cpuValue(value: number) {
  return _.round(value, 2);
}
