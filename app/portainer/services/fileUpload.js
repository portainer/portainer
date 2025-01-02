import { PortainerEndpointCreationTypes } from 'Portainer/models/endpoint/models';

angular.module('portainer.app').factory('FileUploadService', FileUploadFactory);

/* @ngInject */
function FileUploadFactory($q, Upload) {
  var service = {
    // createSchedule, // edge jobs service
    // uploadBackup, // backup service
    // createSwarmStack, // stack service
    // createComposeStack, // stack service
    // createEdgeStack, // edge stack service
    // createCustomTemplate, // custom template service
    // configureRegistry, // registry service
    // createEndpoint, // endpoint service
    // createAzureEndpoint, // endpoint service
    // uploadLDAPTLSFiles, // auth settings controller
    // uploadTLSFilesForEndpoint, // endpoint service
    // uploadOwnershipVoucher, // import device controller
  };

  function uploadFile(url, file) {
    return Upload.upload({ url: url, data: { file: file } });
  }

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

  service.createSwarmStack = function (stackName, swarmId, file, env, endpointId, webhook) {
    return Upload.upload({
      url: `api/stacks/create/swarm/file?endpointId=${endpointId}`,
      data: {
        file: file,
        Name: stackName,
        SwarmID: swarmId,
        Env: Upload.json(env),
        Webhook: webhook,
      },
      ignoreLoadingBar: true,
    });
  };

  service.createComposeStack = function (stackName, file, env, endpointId, webhook) {
    return Upload.upload({
      url: `api/stacks/create/standalone/file?endpointId=${endpointId}`,
      data: {
        file: file,
        Name: stackName,
        Env: Upload.json(env),
        Webhook: webhook,
      },
      ignoreLoadingBar: true,
    });
  };

  service.createEdgeStack = function createEdgeStack({ EdgeGroups, Registries, envVars, staggerConfig, ...payload }, file, dryrun) {
    return Upload.upload({
      url: `api/edge_stacks/create/file?dryrun=${dryrun}`,
      data: {
        file,
        EdgeGroups: Upload.json(EdgeGroups),
        Registries: Upload.json(Registries),
        EnvVars: Upload.json(envVars),
        StaggerConfig: Upload.json(staggerConfig),
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
    checkinInterval,
    EdgePingInterval,
    EdgeSnapshotInterval,
    EdgeCommandInterval
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
        EdgePingInterval: EdgePingInterval,
        EdgeSnapshotInterval: EdgeSnapshotInterval,
        EdgeCommandInterval: EdgeCommandInterval,
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

  return service;
}
