import angular from 'angular';

const statusMap = {
  1: 'ok',
  2: 'error',
  3: 'acknowledged',
};

class EdgeStackStatusController {
  $onChanges({ stackStatus }) {
    if (!stackStatus || !stackStatus.currentValue) {
      return;
    }
    const aggregateStatus = { ok: 0, error: 0, acknowledged: 0 };
    for (let endpointId in stackStatus.currentValue) {
      const endpoint = stackStatus.currentValue[endpointId];
      const endpointStatusKey = statusMap[endpoint.Type];
      aggregateStatus[endpointStatusKey]++;
    }
    this.status = aggregateStatus;
  }
}

angular.module('portainer.edge').controller('EdgeStackStatusController', EdgeStackStatusController);
export default EdgeStackStatusController;
