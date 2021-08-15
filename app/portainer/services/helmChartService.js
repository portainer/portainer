import angular from 'angular';

angular.module('portainer.app').factory('HelmChartService', HelmChartServiceFactory);

/* @ngInject */
function HelmChartServiceFactory($q, HelmCharts, HelmInstall, HelmValues, EndpointProvider) {
  return {
    helmChart,
    helmChartInstall,
    helmChartValues,
  };

  function helmChart() {
    var newchart = {
      templates: [],
    };

    $q.all({
      templates: HelmCharts.get().$promise,
    }).then(function success({ templates }) {
      const chart = templates;

      angular.forEach(chart.entries, function (value, key) {
        newchart.templates.push({ name: key, app: value[0] });
      });
    });
    return newchart;
  }

  function helmChartInstall(appname, namespace, chart, values) {
    const endpointId = EndpointProvider.currentEndpoint().Id;
    var payload = {
      Name: appname,
      Namespace: namespace,
      Chart: chart,
      Values: values,
    };
    return HelmInstall.install({ id: endpointId }, payload).$promise;
  }

  function helmChartValues(chart) {
    var myvalues = '';
    $q.all({
      values: HelmValues.get({ chart: chart }).$promise,
    }).then(function success({ values }) {
      myvalues = values;
    });
    return myvalues;
  }
}
