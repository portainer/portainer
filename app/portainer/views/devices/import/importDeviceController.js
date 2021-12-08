angular
  .module('portainer.app')
  .controller('ImportDeviceController', function ImportDeviceController(
    $async,
    $q,
    $scope,
    EndpointService,
    GroupService,
    TagService,
    Notifications,
    Authentication,
    FileUploadService
  ) {
    $scope.state = {
      actionInProgress: false,
      voucherUploading: false,
      voucherUploaded: false,
      allowCreateTag: Authentication.isAdmin(),
    };

    $scope.formValues = {
      DeviceName: '',
      DeviceProfile: '',
      GroupId: 1,
      TagIds: [],
    };

    // TODO preguntar que es esto, hay pantalla de CRUD?
    $scope.profiles = [
      { Id: 1, Name: 'profile1' },
      { Id: 2, Name: 'profile2' },
    ];

    $scope.onVoucherFileChange = function (file) {
      console.log(file);
      if (file) {
        $scope.state.voucherUploading = true;

        FileUploadService.uploadOwnershipVoucher(file)
          .then(function success(response) {
            console.log(response);
            $scope.state.voucherUploading = false;
            $scope.state.voucherUploaded = true;
          })
          .catch(function error(err) {
            console.log(err);
            $scope.state.voucherUploading = false;
            Notifications.error('Failure', err, 'Unable to upload Ownership Voucher');
          });
      }
    };

    $scope.onCreateTag = function onCreateTag(tagName) {
      return $async(onCreateTagAsync, tagName);
    };
    async function onCreateTagAsync(tagName) {
      try {
        const tag = await TagService.createTag(tagName);
        $scope.availableTags = $scope.availableTags.concat(tag);
        $scope.formValues.TagIds = $scope.formValues.TagIds.concat(tag.Id);
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to create tag');
      }
    }

    $scope.saveDevice = function () {
      return $async(async () => {
        $scope.state.actionInProgress = true;
        try {
          // TODO save endpoint?
          // const endpoint = await EndpointService.createRemoteEndpoint();

          Notifications.success('Device successfully imported', name);
        } catch (err) {
          Notifications.error('Failure', err, 'Unable to create environment');
        } finally {
          $scope.state.actionInProgress = false;
        }
      });
    };

    function initView() {
      $q.all({
        groups: GroupService.groups(),
        tags: TagService.tags(),
      })
        .then(function success(data) {
          $scope.groups = data.groups;
          $scope.availableTags = data.tags;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to load groups');
        });
    }

    initView();
  });
