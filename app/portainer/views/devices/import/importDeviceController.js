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
    FileUploadService,
    FDOService
  ) {
    $scope.state = {
      actionInProgress: false,
      voucherUploading: false,
      voucherUploaded: false,
      deviceID: '',
      allowCreateTag: Authentication.isAdmin(),
    };

    $scope.formValues = {
      DeviceName: '',
      DeviceProfile: '',
      GroupId: 1,
      TagIds: [],
      VoucherFile: null,
    };

    $scope.profiles = [{ Id: 1, Name: 'Docker Standalone + Edge Agent' }];

    $scope.onVoucherFileChange = function (file) {
      console.log(file);
      if (file) {
        $scope.state.voucherUploading = true;

        FileUploadService.uploadOwnershipVoucher(file)
          .then(function success(response) {
            console.log(response);
            $scope.state.voucherUploading = false;
            $scope.state.voucherUploaded = true;
            $scope.deviceID = response.data.guid;
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

    $scope.configureDevice = function () {
      return $async(async () => {
        $scope.state.actionInProgress = true;

        // TODO: create the endpoint (environment) and pass the data to configureDevice

        try {
          await FDOService.configureDevice($scope.deviceID, $scope.formValues);
          Notifications.success('Device successfully imported');
        } catch (err) {
          Notifications.error('Failure', err, 'Unable to import device');
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
