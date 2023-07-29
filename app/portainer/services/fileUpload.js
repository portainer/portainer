import { PortainerEndpointCreationTypes } from 'Portainer/models/endpoint/models';
import { genericHandler, jsonObjectsToArrayHandler } from '../../docker/rest/response/handlers';

angular.module('portainer.app').factory('FileUploadService', [
  '$q',
  'Upload',
  'EndpointProvider',
  function FileUploadFactory($q, Upload, EndpointProvider) {
    'use strict';

    var service = {};

    function uploadFile(url, file) {
      return Upload.upload({ url: url, data: { file: file } });
    }

    service.buildImage = function (endpointID, names, file, path) {
      return Upload.http({
        url: `api/endpoints/${endpointID}/docker/build`,
        headers: {
          'Content-Type': file.type,
        },
        data: file,
        params: {
          t: names,
          dockerfile: path,
        },
        ignoreLoadingBar: true,
        transformResponse: function (data) {
          return jsonObjectsToArrayHandler(data);
        },
      });
    };

    service.buildImageFromFiles = function (endpointID, names, files) {
      return Upload.upload({
        url: `api/endpoints/${endpointID}/docker/build`,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        data: { file: files },
        params: {
          t: names,
        },
        transformResponse: function (data) {
          return jsonObjectsToArrayHandler(data);
        },
      });
    };

    service.loadImages = function (file) {
      var endpointID = EndpointProvider.endpointID();
      return Upload.http({
        url: 'api/endpoints/' + endpointID + '/docker/images/load',
        headers: {
          'Content-Type': file.type,
        },
        data: file,
        ignoreLoadingBar: true,
        transformResponse: genericHandler,
      });
    };

    service.createSchedule = function (payload) {
      return Upload.upload({
        url: 'api/edge_jobs/create/file',
        data: {
          file: payload.File,
          Name: payload.Name,
          CronExpression: payload.CronExpression,
          Image: payload.Image,
          Endpoints: Upload.json(payload.Endpoints),
          RetryCount: payload.RetryCount,
          RetryInterval: payload.RetryInterval,
        },
      });
    };

    service.uploadBackup = function (file, password) {
      return Upload.upload({
        url: 'api/restore',
        data: {
          file,
          password,
        },
      });
    };

    service.createSwarmStack = function (stackName, swarmId, file, env, endpointId) {
      return Upload.upload({
        url: `api/stacks/create/swarm/file?endpointId=${endpointId}`,
        data: {
          file: file,
          Name: stackName,
          SwarmID: swarmId,
          Env: Upload.json(env),
        },
        ignoreLoadingBar: true,
      });
    };

    service.createComposeStack = function (stackName, file, env, endpointId) {
      return Upload.upload({
        url: `api/stacks/create/standalone/file?endpointId=${endpointId}`,
        data: {
          file: file,
          Name: stackName,
          Env: Upload.json(env),
        },
        ignoreLoadingBar: true,
      });
    };

    service.createEdgeStack = function createEdgeStack({ EdgeGroups, envVars, ...payload }, file) {
      return Upload.upload({
        url: `api/edge_stacks/create/file`,
        data: {
          file,
          EdgeGroups: Upload.json(EdgeGroups),
          EnvVars: Upload.json(envVars),
          ...payload,
        },
        ignoreLoadingBar: true,
      });
    };

    service.createCustomTemplate = function createCustomTemplate(data) {
      return Upload.upload({
        url: 'api/custom_templates/create/file',
        data,
        ignoreLoadingBar: true,
      });
    };

    service.configureRegistry = function (registryId, registryManagementConfigurationModel) {
      return Upload.upload({
        url: 'api/registries/' + registryId + '/configure',
        data: registryManagementConfigurationModel,
      });
    };

    service.createEndpoint = function (
      name,
      creationType,
      URL,
      PublicURL,
      groupID,
      tagIds,
      TLS,
      TLSSkipVerify,
      TLSSkipClientVerify,
      TLSCAFile,
      TLSCertFile,
      TLSKeyFile,
      checkinInterval
    ) {
      return Upload.upload({
        url: 'api/endpoints',
        data: {
          Name: name,
          EndpointCreationType: creationType,
          URL: URL,
          PublicURL: PublicURL,
          GroupID: groupID,
          TagIds: Upload.json(tagIds),
          TLS: TLS,
          TLSSkipVerify: TLSSkipVerify,
          TLSSkipClientVerify: TLSSkipClientVerify,
          TLSCACertFile: TLSCAFile,
          TLSCertFile: TLSCertFile,
          TLSKeyFile: TLSKeyFile,
          CheckinInterval: checkinInterval,
        },
        ignoreLoadingBar: true,
      });
    };

    service.createAzureEndpoint = function (name, applicationId, tenantId, authenticationKey, groupId, tagIds) {
      return Upload.upload({
        url: 'api/endpoints',
        data: {
          Name: name,
          EndpointCreationType: PortainerEndpointCreationTypes.AzureEnvironment,
          GroupID: groupId,
          TagIds: Upload.json(tagIds),
          AzureApplicationID: applicationId,
          AzureTenantID: tenantId,
          AzureAuthenticationKey: authenticationKey,
        },
        ignoreLoadingBar: true,
      });
    };

    service.uploadLDAPTLSFiles = function (TLSCAFile, TLSCertFile, TLSKeyFile) {
      var queue = [];

      if (TLSCAFile) {
        queue.push(uploadFile('api/upload/tls/ca?folder=ldap', TLSCAFile));
      }
      if (TLSCertFile) {
        queue.push(uploadFile('api/upload/tls/cert?folder=ldap', TLSCertFile));
      }
      if (TLSKeyFile) {
        queue.push(uploadFile('api/upload/tls/key?folder=ldap', TLSKeyFile));
      }

      return $q.all(queue);
    };

    service.uploadTLSFilesForEndpoint = function (endpointID, TLSCAFile, TLSCertFile, TLSKeyFile) {
      var queue = [];

      if (TLSCAFile) {
        queue.push(uploadFile('api/upload/tls/ca?folder=' + endpointID, TLSCAFile));
      }
      if (TLSCertFile) {
        queue.push(uploadFile('api/upload/tls/cert?folder=' + endpointID, TLSCertFile));
      }
      if (TLSKeyFile) {
        queue.push(uploadFile('api/upload/tls/key?folder=' + endpointID, TLSKeyFile));
      }

      return $q.all(queue);
    };

    service.uploadOwnershipVoucher = function (voucherFile) {
      return Upload.upload({
        url: 'api/fdo/register',
        data: {
          voucher: voucherFile,
        },
        ignoreLoadingBar: true,
      });
    };

    return service;
  },
]);
