angular.module('portainer.docker').controller('NodeLabelsTableController', [
  function NodeLabelsTableController() {
    var ctrl = this;
    ctrl.removeLabel = removeLabel;
    ctrl.updateLabel = updateLabel;

    function removeLabel(index) {
      var removedElement = ctrl.labels.splice(index, 1);
      if (removedElement !== null) {
        console.log(ctrl.labels);
        ctrl.onChangedLabels({labels: ctrl.labels});
      }
    }

    function updateLabel(label) {
      if (
        label.value !== label.originalValue ||
        label.key !== label.originalKey
      ) {
        ctrl.onChangedLabels({labels: ctrl.labels});
      }
    }
  }
]);
