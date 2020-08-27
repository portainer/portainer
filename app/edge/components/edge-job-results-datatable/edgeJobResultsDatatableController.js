import angular from 'angular';
import _ from 'lodash-es';

export class EdgeJobResultsDatatableController {
  /* @ngInject */
  constructor($controller, $scope, $state) {
    this.$state = $state;
    angular.extend(this, $controller('GenericDatatableController', { $scope }));
  }

  collectLogs(...args) {
    this.settings.repeater.autoRefresh = true;
    this.settings.repeater.refreshRate = '5';
    this.onSettingsRepeaterChange();
    this.onCollectLogsClick(...args);
  }

  $onChanges({ dataset }) {
    if (dataset && dataset.currentValue) {
      this.onDatasetChange(dataset.currentValue);
    }
  }

  onDatasetChange(dataset) {
    const anyCollecting = _.some(dataset, (item) => item.LogsStatus === 2);
    this.settings.repeater.autoRefresh = anyCollecting;
    this.settings.repeater.refreshRate = '5';
    this.onSettingsRepeaterChange();
  }
}
