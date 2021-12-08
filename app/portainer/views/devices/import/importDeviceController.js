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

            // TODO parse deviceID from response
            //$scope.deviceID = response.data.DeviceID ?;
            $scope.deviceID = 'c6ea3343-229a-4c07-9096-beef7134e1d3';
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
          await FDOService.importDevice($scope.deviceID, $scope.formValues);
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
