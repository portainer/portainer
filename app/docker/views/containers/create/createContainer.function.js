export default async function createContainer() {
  var oldContainer = null;

  this.HttpRequestHelper.setPortainerAgentTargetHeader(this.formValues.NodeName);

  let final = () => {
    this.state.actionInProgress = false;
  };

  let setOldContainer = (container) => {
    oldContainer = container;
    return container;
  };

  let findCurrentContainer = () => {
    let onQuerySuccess = (containers) => {
      if (!containers.length) {
        return;
      }
      return containers[0];
    };

    let notifyOnError = (err) => {
      this.Notifications.error('Failure', err, 'Unable to retrieve containers');
    }

    return this.ContainerService.containers(1, { name: ['^/' + this.config.name + '$'] })
      .then(onQuerySuccess)
      .catch(notifyOnError);
  };

  let startCreationProcess = (confirmed) => {
    if (!confirmed) {
      return this.$q.when();
    }
    if (!validateAccessControl()) {
      return this.$q.when();
    }
    this.state.actionInProgress = true;
    return pullImageIfNeeded()
      .then(stopAndRenameContainer)
      .then(createNewContainer)
      .then(applyResourceControl)
      .then(connectToExtraNetworks)
      .then(removeOldContainer)
      .then(onSuccess)
      .catch(onCreationProcessFail);
  };

  let onCreationProcessFail = (error) => {
    var deferred = this.$q.defer();
    removeNewContainer()
      .then(restoreOldContainerName)
      .then(() => deferred.reject(error))
      .catch((restoreError) => deferred.reject(restoreError));
    return deferred.promise;
  };

  let removeNewContainer = () => {
    let onContainerLoaded = (container) => {
      if (container && (!oldContainer || container.Id !== oldContainer.Id)) {
        return this.ContainerService.remove(container, true);
      }
    };

    return findCurrentContainer().then(onContainerLoaded);
  };

  let restoreOldContainerName = () => {
    if (!oldContainer) {
      return;
    }
    return this.ContainerService.renameContainer(oldContainer.Id, oldContainer.Names[0].substring(1));
  };

  let confirmCreateContainer = (container) => {
    if (!container) {
      return this.$q.when(true);
    }
    let showConfirmationModal = () => {
      var deferred = this.$q.defer();

      let onConfirm = (confirmed) => deferred.resolve(confirmed);

      this.ModalService.confirm({
        title: 'Are you sure ?',
        message: 'A container with the same name already exists. Portainer can automatically remove it and re-create one. Do you want to replace it?',
        buttons: {
          confirm: {
            label: 'Replace',
            className: 'btn-danger'
          }
        },
        callback: onConfirm
      });

      return deferred.promise;
    }
    return showConfirmationModal();
  };

  let stopAndRenameContainer = () => {
    if (!oldContainer) {
      return this.$q.when();
    }
    return stopContainerIfNeeded(oldContainer)
      .then(renameContainer);
  };

  let stopContainerIfNeeded = (oldContainer) => {
    if (oldContainer.State !== 'running') {
      return this.$q.when();
    }
    return this.ContainerService.stopContainer(oldContainer.Id);
  };

  let renameContainer = () => {
    return this.ContainerService.renameContainer(oldContainer.Id, oldContainer.Names[0].substring(1) + '-old');
  };

  let pullImageIfNeeded = () => {
    return this.$q.when(this.formValues.alwaysPull &&
      this.ImageService.pullImage(this.config.Image, this.formValues.Registry, true));
  };

  let createNewContainer = () => {
    var config = this.prepareConfiguration();
    return this.ContainerService.createAndStartContainer(config);
  };

  let applyResourceControl = (newContainer) => {
    var containerIdentifier = newContainer.Id;
    var userId = this.Authentication.getUserDetails().ID;

    let onApplyResourceControlSuccess = () => containerIdentifier;

    return this.$q.when(this.ResourceControlService.applyResourceControl(
      'container',
      containerIdentifier,
      userId,
      this.formValues.AccessControlData, []
    )).then(onApplyResourceControlSuccess);
  };

  let connectToExtraNetworks = (newContainerId) => {
    if (!this.extraNetworks) {
      return this.$q.when();
    }

    var connectionPromises = Object.keys(this.extraNetworks).map((networkName) => {
      return this.NetworkService.connectContainer(networkName, newContainerId);
    });

    return this.$q.all(connectionPromises);
  };

  let removeOldContainer = () => {
    var deferred = this.$q.defer();

    if (!oldContainer) {
      deferred.resolve();
      return;
    }

    let notifyOnRemoval = () => {
      this.Notifications.success('Container Removed', oldContainer.Id);
      deferred.resolve();
    };

    let notifyOnRemoveError = (err) => {
      deferred.reject({ msg: 'Unable to remove container', err: err });
    };

    this.ContainerService.remove(oldContainer, true)
      .then(notifyOnRemoval)
      .catch(notifyOnRemoveError);

    return deferred.promise;
  };

  let notifyOnError = (err) => {
    this.Notifications.error('Failure', err, 'Unable to create container');
  };

  let validateAccessControl = () => {
    var accessControlData = this.formValues.AccessControlData;
    var userDetails = this.Authentication.getUserDetails();
    var isAdmin = userDetails.role === 1;

    return this.validateForm(accessControlData, isAdmin);
  };

  let onSuccess = () => {
    this.Notifications.success('Container successfully created');
    this.$state.go('docker.containers', {}, { reload: true });
  };

  return findCurrentContainer()
    .then(setOldContainer)
    .then(confirmCreateContainer)
    .then(startCreationProcess)
    .catch(notifyOnError)
    .finally(final);
}