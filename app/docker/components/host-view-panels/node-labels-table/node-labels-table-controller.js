angular.module('portainer.docker').controller('NodeLabelsTableController', [
  function NodeLabelsTableController() {
    var ctrl = this;
    ctrl.removeLabel = removeLabel;
    ctrl.updateLabel = updateLabel;

    function removeLabel(index) {
      var label = ctrl.labels.splice(index, 1);
      if (label !== null) {
        ctrl.onChangedLabels({ labels: ctrl.labels });
      }
    }

    function updateLabel(label) {
      if (label.value !== label.originalValue || label.key !== label.originalKey) {
        ctrl.onChangedLabels({ labels: ctrl.labels });
      }
    }
  },
]);
