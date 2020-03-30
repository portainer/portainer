import _ from 'lodash-es';

class KubernetesFormValidationHelper {
  // TODO: review : use
  // static getDuplicates(names) {
  //   // const names = _.map(env, 'Name');
  //   const groupped = _.groupBy(names);
  //   const res = {};
  //   _.forEach(names, (name, index) => {
  //     if (groupped[name].length > 1) {
  //       res[index] = name;
  //     }
  //   });
  //   return res;
  // }

  // TODO: review call the above changed function
  // using _.map(this.formValues.Data, 'Key')
  // instead of _.map(this.formValues.Data, (data) => data.Key)
  // or _.map(this.formValues.EnvironmentVariables, 'Name')
  // instead of _.map(this.formValues.EnvironmentVariables, (env) => env.Name)
  static getDuplicates(values) {
    let map = new Map();
    _.forEach(values, (value) => map.set(value, (map.get(value) || 0) + 1));
    return Object.fromEntries(_.map(values, (value, index) => {
      return [index, value];
    }).filter((item) => map.get(item[1]) > 1));
  }
}
export default KubernetesFormValidationHelper;