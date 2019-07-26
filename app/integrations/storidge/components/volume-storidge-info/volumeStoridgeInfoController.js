angular.module('portainer.docker')
.controller('VolumeStoridgeInfoController', ['$state', 'StoridgeVolumeService', 'Notifications',
function ($state, StoridgeVolumeService, Notifications) {
  var ctrl = this;

  this.state = {
    updateInProgress: false,
    isUpdating: false
  };

  this.addLabel = function() {
    this.formValues.Labels.push({ name: '', value: ''});
  };

  this.removeLabel = function(index) {
    this.formValues.Labels.splice(index, 1);
  };

  this.initLabels = function() {
    var labels = this.volume.Labels;
    if (labels) {
      this.formValues.Labels = Object.keys(labels).map(function(key) {
        return { name:key, value:labels[key] };
      });
    }
  };

  this.updateVolume = function() {
    this.state.updateInProgress = true;
    this.formValues = {
      IOPSMin: this.volume.IOPSMin,
      IOPSMax: this.volume.IOPSMax,
      Node: this.volume.Node,
      Capacity: this.volume.Capacity,
      BandwidthMin: this.volume.BandwidthMin,
      BandwidthMax: this.volume.BandwidthMax,
      Labels: []
    };
    this.initLabels();
  };

  this.cancelUpdate = function() {
    this.state.updateInProgress = false;
    this.formValues = {};
  };

  this.prepareLabels = function(volume) {
    var labels = {};
    this.formValues.Labels.forEach(function (label) {
      if (label.name && label.value) {
        labels[label.name] = label.value;
      }
    });
    volume.Labels = labels;
  };

  this.prepareVolume = function() {
    var volume = angular.copy(this.formValues);
    var data = this.volume;
    
    if (volume.Node === data.Node || !volume.Node) {
      delete volume.Node;
    }
    if (volume.Capacity === data.Capacity || !volume.Capacity) {
      delete volume.Capacity;
    }
    if (volume.IOPSMin === data.IOPSMin || !volume.IOPSMin) {
      delete volume.IOPSMin;
    } else {
      volume.IOPSMin = volume.IOPSMin.toString();
    }
    if (volume.IOPSMax === data.IOPSMax || !volume.IOPSMax) {
      delete volume.IOPSMax;
    } else {
      volume.IOPSMax = volume.IOPSMax.toString();
    }
    if (volume.BandwidthMin === data.BandwidthMin || !volume.BandwidthMin) {
      delete volume.BandwidthMin;
    }
    if (volume.BandwidthMax === data.BandwidthMax || !volume.BandwidthMax) {
      delete volume.BandwidthMax;
    }
    this.prepareLabels(volume);
    return volume;
  };

  this.confirmUpdate = function() {
    this.state.isUpdating = true;

    var volume = this.prepareVolume();
    volume.Name = this.volume.Name;
    StoridgeVolumeService.update(volume)
    .then(function success() {
      Notifications.success('Volume successfully updated');
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update volume');
      ctrl.state.isUpdating = false;
    });
  };

}]);
