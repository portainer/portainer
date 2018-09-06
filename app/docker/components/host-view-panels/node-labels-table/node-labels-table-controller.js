angular.module('portainer.docker').controller('NodeLabelsTableController', [
  function NodeLabelsTableController() {
    var ctrl = this;
    ctrl.removeLabel = removeLabel;
    ctrl.updateLabel = updateLabel;
    ctrl.save = save;
    ctrl.hasChanges = false;
    ctrl.cancelChanges = cancelChanges;

    function removeLabel(index) {
      var label = ctrl.labels.splice(index, 1);
      if (label !== null) {
        ctrl.hasChanges = true;
      }
    }

    function updateLabel(label) {
      if (
        label.value !== label.originalValue ||
        label.key !== label.originalKey
      ) {
        ctrl.hasChanges = true;
      }
    }

    function save() {
      ctrl.onChangedLabels({ labels: ctrl.labels });
    }

    function cancelChanges() {
      ctrl.labels = ctrl.labels
        .filter(function(label) {
          return label.originalValue || label.originalKey;
        })
        .map(function(label) {
          return Object.assign(label, {
            value: label.originalValue,
            key: label.originalKey
          });
        });
      ctrl.hasChanges = false;
    }
  }
]);
