import 'cypress-wait-until';
import _ from 'lodash-es';
import { STATEOBJECT } from './vars.js';

Cypress.Commands.add('validateDockerSwarmAbilities', (endpointName, role) => {
  cy.route2({ method: 'GET', path: '**/stacks*' }).as('validateAbilities:stacks');
  // TEST RESOURCE SETUP
  // create all type of resource as admin
  cy.auth('frontend', 'admin', 'portainer');
  cy.selectEndpoint(endpointName, 'Docker Swarm');
  cy.createStack('frontend', 'adminstack');
  cy.createService('frontend', 'adminservice');
  cy.createContainer('frontend', 'admincontainer');
  cy.createNetwork('frontend', 'adminnetwork');
  cy.createVolume('frontend', 'adminvolume');
  cy.createConfig('frontend', 'adminconfig');
  cy.createSecret('frontend', 'adminsecret');

  // create all types of resources with public ownership
  cy.createStack('frontend', 'publicstack', 'public');
  cy.createService('frontend', 'publicservice', 'public');
  cy.createContainer('frontend', 'publiccontainer', 'public');
  cy.createNetwork('frontend', 'publicnetwork', 'public');
  cy.createVolume('frontend', 'publicolume', 'public');
  cy.createConfig('frontend', 'publiconfig', 'public');
  cy.createSecret('frontend', 'publicsecret', 'public');
  cy.logout('admin');
  cy.auth('frontend', 'rbac-user', 'portainer');
  cy.selectEndpoint(endpointName, 'Docker Swarm');

  if (role == 'Endpoint administrator') {
    // Create all types of resources
    STATEOBJECT.ACTIVE_RESOURCE = 'stack-' + new Date().valueOf();
    cy.createStack('frontend', STATEOBJECT.ACTIVE_RESOURCE);
    STATEOBJECT.USER_RESOURCES[0] = STATEOBJECT.ACTIVE_RESOURCE;
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/stacks`);
    cy.showAllResources();
    cy.wait(1000);
    cy.get('stacks-datatable').within(() => {
      cy.getResourceNames('stack').then((resourceNames) => expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[0]));
    });

    STATEOBJECT.ACTIVE_RESOURCE = 'service-' + new Date().valueOf();
    cy.createService('frontend', STATEOBJECT.ACTIVE_RESOURCE);
    STATEOBJECT.USER_RESOURCES[1] = STATEOBJECT.ACTIVE_RESOURCE;
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/services`);
    cy.showAllResources();
    cy.wait(500);
    cy.get('services-datatable').within(() => {
      cy.getResourceNames('service').then((resourceNames) => expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[1]));
    });

    STATEOBJECT.ACTIVE_RESOURCE = 'container-' + new Date().valueOf();
    cy.createContainer('frontend', STATEOBJECT.ACTIVE_RESOURCE);
    STATEOBJECT.USER_RESOURCES[2] = STATEOBJECT.ACTIVE_RESOURCE;
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/containers`);
    cy.showAllResources();
    cy.wait(500);
    cy.get('containers-datatable').within(() => {
      cy.getResourceNames('container').then((resourceNames) => expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[2]));
    });

    STATEOBJECT.ACTIVE_RESOURCE = 'network-' + new Date().valueOf();
    cy.createNetwork('frontend', STATEOBJECT.ACTIVE_RESOURCE);
    STATEOBJECT.USER_RESOURCES[3] = STATEOBJECT.ACTIVE_RESOURCE;
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/networks`);
    cy.showAllResources();
    cy.wait(1000);
    cy.get('networks-datatable').within(() => {
      cy.getResourceNames('network').then((resourceNames) => expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[3]));
    });

    STATEOBJECT.ACTIVE_RESOURCE = 'volume-' + new Date().valueOf();
    cy.createVolume('frontend', STATEOBJECT.ACTIVE_RESOURCE);
    STATEOBJECT.USER_RESOURCES[4] = STATEOBJECT.ACTIVE_RESOURCE;
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/volumes`);
    cy.showAllResources();
    cy.wait(2000);
    cy.get('volumes-datatable').within(() => {
      cy.getResourceNames('volume').then((resourceNames) => expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[4]));
    });

    STATEOBJECT.ACTIVE_RESOURCE = 'config-' + new Date().valueOf();
    cy.createConfig('frontend', STATEOBJECT.ACTIVE_RESOURCE);
    STATEOBJECT.USER_RESOURCES[5] = STATEOBJECT.ACTIVE_RESOURCE;
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/configs`);
    cy.showAllResources();
    cy.wait(1500);
    cy.get('configs-datatable').within(() => {
      cy.getResourceNames('config').then((resourceNames) => expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[5]));
    });

    STATEOBJECT.ACTIVE_RESOURCE = 'secret-' + new Date().valueOf();
    cy.createSecret('frontend', STATEOBJECT.ACTIVE_RESOURCE);
    STATEOBJECT.USER_RESOURCES[6] = STATEOBJECT.ACTIVE_RESOURCE;
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/secrets`);
    cy.showAllResources();
    cy.wait(500);
    cy.get('secrets-datatable').within(() => {
      cy.getResourceNames('secret').then((resourceNames) => expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[6]));
    });

    // Read all types of resources
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/stacks`);
    cy.wait(1000);
    cy.get('stacks-datatable').within(() => {
      cy.getResourceNames('stack').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[0]).and.to.contain('adminstack').and.to.contain('publicstack');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/services`);
    cy.wait(500);
    cy.get('services-datatable').within(() => {
      cy.getResourceNames('service').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[1]).and.to.contain('adminservice').and.to.contain('publicservice');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/containers`);
    cy.wait(500);
    cy.get('containers-datatable').within(() => {
      cy.getResourceNames('container').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[2]).and.to.contain('admincontainer').and.to.contain('publiccontainer');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/networks`);
    cy.wait(1000);
    cy.get('networks-datatable').within(() => {
      cy.getResourceNames('network').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[3]).and.to.contain('adminnetwork').and.to.contain('publicstack');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/volumes`);
    cy.wait(2000);
    cy.get('volumes-datatable').within(() => {
      cy.getResourceNames('volume').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[4]).and.to.contain('adminvolume').and.to.contain('publicvolume');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/configs`);
    cy.wait(1500);
    cy.get('configs-datatable').within(() => {
      cy.getResourceNames('config').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[5]).and.to.contain('adminconfig').and.to.contain('publicconfig');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/secrets`);
    cy.wait(500);
    cy.get('secrets-datatable').within(() => {
      cy.getResourceNames('secret').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[6]).and.to.contain('adminsecret').and.to.contain('publicsecret');
      });
    });

    // Update all types of resources that can be updated
    cy.updateStack(STATEOBJECT.USER_RESOURCES[0]);
    cy.updateStack('adminstack');
    cy.updateStack('publicstack');
    cy.updateService(STATEOBJECT.USER_RESOURCES[1]);
    cy.updateService('adminservice');
    cy.updateContainer(STATEOBJECT.USER_RESOURCES[2]);
    cy.updateContainer('admincontainer');

    // Delete all types of resources
    cy.deleteStack('frontend', STATEOBJECT.USER_RESOURCES[0]);
    cy.deleteStack('frontend', 'adminstack');
    cy.deleteStack('frontend', 'publicstack');
    cy.get('stacks-datatable').within(() => {
      cy.getResourceNames('stack').then((resourceNames) => {
        expect(resourceNames).to.not.contain(STATEOBJECT.USER_RESOURCES[0]).and.to.not.contain('adminstack').and.to.not.contain('publicstack');
      });
    });

    cy.deleteService('frontend', STATEOBJECT.USER_RESOURCES[1]);
    cy.deleteService('frontend', 'adminservice');
    cy.deleteService('frontend', 'publicservice');
    cy.get('services-datatable').within(() => {
      cy.getResourceNames('service').then((resourceNames) => {
        expect(resourceNames).to.not.contain(STATEOBJECT.USER_RESOURCES[1]).and.to.not.contain('adminservice').and.to.not.contain('publicservice');
      });
    });

    cy.deleteContainer('frontend', STATEOBJECT.USER_RESOURCES[2]);
    cy.deleteContainer('frontend', 'admincontainer');
    cy.deleteContainer('frontend', 'publiccontainer');
    cy.get('containers-datatable').within(() => {
      cy.getResourceNames('container').then((resourceNames) => {
        expect(resourceNames).to.not.contain(STATEOBJECT.USER_RESOURCES[2]).and.to.not.contain('admincontainer').and.to.not.contain('publiccontainer');
      });
    });

    cy.deleteNetwork('frontend', STATEOBJECT.USER_RESOURCES[3]);
    cy.deleteNetwork('frontend', 'adminnetwork');
    cy.deleteNetwork('frontend', 'publicnetwork');
    cy.get('networks-datatable').within(() => {
      cy.getResourceNames('network').then((resourceNames) => {
        expect(resourceNames).to.not.contain(STATEOBJECT.USER_RESOURCES[3]).and.to.not.contain('adminnetwork').and.to.not.contain('publicnetwork');
      });
    });

    cy.deleteVolume('frontend', STATEOBJECT.USER_RESOURCES[4]);
    cy.deleteVolume('frontend', 'adminvolume');
    cy.deleteVolume('frontend', 'publicvolume');
    cy.get('volumes-datatable').within(() => {
      cy.getResourceNames('volumes').then((resourceNames) => {
        expect(resourceNames).to.not.contain(STATEOBJECT.USER_RESOURCES[4]).and.to.not.contain('adminvolume').and.to.not.contain('publicvolume');
      });
    });

    cy.deleteConfig('frontend', STATEOBJECT.USER_RESOURCES[5]);
    cy.deleteConfig('frontend', 'adminconfig');
    cy.deleteConfig('frontend', 'publicconfig');
    cy.get('configs-datatable').within(() => {
      cy.getResourceNames('configs').then((resourceNames) => {
        expect(resourceNames).to.not.contain(STATEOBJECT.USER_RESOURCES[5]).and.to.not.contain('adminconfig').and.to.not.contain('publicconfig');
      });
    });

    cy.deleteSecret('frontend', STATEOBJECT.USER_RESOURCES[6]);
    cy.deleteSecret('frontend', 'adminsecret');
    cy.deleteSecret('frontend', 'publicsecret');
    cy.get('secrets-datatable').within(() => {
      cy.getResourceNames('secrets').then((resourceNames) => {
        expect(resourceNames).to.not.contain(STATEOBJECT.USER_RESOURCES[6]).and.to.not.contain('adminsecret').and.to.not.contain('publicsecret');
      });
    });
  }

  // If user has Helpdesk role:
  if (role == 'Helpdesk') {
    cy.log(`Asserting for ${role}`);
    cy.auth('frontend', 'rbac-user', 'portainer');
    cy.selectEndpoint(endpointName, 'Docker Swarm');
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/stacks`);
    cy.wait(1000);
    cy.get('stacks-datatable').within(() => {
      cy.getResourceNames('stack').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[0]).and.to.contain('adminstack').and.to.contain('publicstack');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/services`);
    cy.wait(500);
    cy.get('services-datatable').within(() => {
      cy.getResourceNames('service').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[1]).and.to.contain('adminservice').and.to.contain('publicservice');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/containers`);
    cy.wait(500);
    cy.get('containers-datatable').within(() => {
      cy.getResourceNames('container').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[2]).and.to.contain('admincontainer').and.to.contain('publiccontainer');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/networks`);
    cy.wait(1000);
    cy.get('networks-datatable').within(() => {
      cy.getResourceNames('network').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[3]).and.to.contain('adminnetwork').and.to.contain('publicstack');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/volumes`);
    cy.wait(2000);
    cy.get('volumes-datatable').within(() => {
      cy.getResourceNames('volume').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[4]).and.to.contain('adminvolume').and.to.contain('publicvolume');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/configs`);
    cy.wait(1500);
    cy.get('configs-datatable').within(() => {
      cy.getResourceNames('config').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[5]).and.to.contain('adminconfig').and.to.contain('publicconfig');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/secrets`);
    cy.wait(500);
    cy.get('secrets-datatable').within(() => {
      cy.getResourceNames('secret').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[6]).and.to.contain('adminsecret').and.to.contain('publicsecret');
      });
    });
  }

  // If user has Standard user role:
  if (role == 'Standard user') {
    cy.log(`Asserting for ${role}`);
    // Create all types of resources
    STATEOBJECT.ACTIVE_RESOURCE = 'stack-' + new Date().valueOf();
    cy.createStack('frontend', STATEOBJECT.ACTIVE_RESOURCE);
    STATEOBJECT.USER_RESOURCES[0] = STATEOBJECT.ACTIVE_RESOURCE;
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/stacks`);
    cy.showAllResources();
    cy.wait(1000);
    cy.get('stacks-datatable').within(() => {
      cy.getResourceNames('stack').then((resourceNames) => expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[0]));
    });

    STATEOBJECT.ACTIVE_RESOURCE = 'service-' + new Date().valueOf();
    cy.createService('frontend', STATEOBJECT.ACTIVE_RESOURCE);
    STATEOBJECT.USER_RESOURCES[1] = STATEOBJECT.ACTIVE_RESOURCE;
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/services`);
    cy.showAllResources();
    cy.wait(500);
    cy.get('services-datatable').within(() => {
      cy.getResourceNames('service').then((resourceNames) => expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[1]));
    });

    STATEOBJECT.ACTIVE_RESOURCE = 'container-' + new Date().valueOf();
    cy.createContainer('frontend', STATEOBJECT.ACTIVE_RESOURCE);
    STATEOBJECT.USER_RESOURCES[2] = STATEOBJECT.ACTIVE_RESOURCE;
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/containers`);
    cy.showAllResources();
    cy.wait(500);
    cy.get('containers-datatable').within(() => {
      cy.getResourceNames('container').then((resourceNames) => expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[2]));
    });

    STATEOBJECT.ACTIVE_RESOURCE = 'network-' + new Date().valueOf();
    cy.createNetwork('frontend', STATEOBJECT.ACTIVE_RESOURCE);
    STATEOBJECT.USER_RESOURCES[3] = STATEOBJECT.ACTIVE_RESOURCE;
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/networks`);
    cy.showAllResources();
    cy.wait(1000);
    cy.get('networks-datatable').within(() => {
      cy.getResourceNames('network').then((resourceNames) => expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[3]));
    });

    STATEOBJECT.ACTIVE_RESOURCE = 'volume-' + new Date().valueOf();
    cy.createVolume('frontend', STATEOBJECT.ACTIVE_RESOURCE);
    STATEOBJECT.USER_RESOURCES[4] = STATEOBJECT.ACTIVE_RESOURCE;
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/volumes`);
    cy.showAllResources();
    cy.wait(2000);
    cy.get('volumes-datatable').within(() => {
      cy.getResourceNames('volume').then((resourceNames) => expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[4]));
    });

    STATEOBJECT.ACTIVE_RESOURCE = 'config-' + new Date().valueOf();
    cy.createConfig('frontend', STATEOBJECT.ACTIVE_RESOURCE);
    STATEOBJECT.USER_RESOURCES[5] = STATEOBJECT.ACTIVE_RESOURCE;
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/configs`);
    cy.showAllResources();
    cy.wait(1500);
    cy.get('configs-datatable').within(() => {
      cy.getResourceNames('config').then((resourceNames) => expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[5]));
    });

    STATEOBJECT.ACTIVE_RESOURCE = 'secret-' + new Date().valueOf();
    cy.createSecret('frontend', STATEOBJECT.ACTIVE_RESOURCE);
    STATEOBJECT.USER_RESOURCES[6] = STATEOBJECT.ACTIVE_RESOURCE;
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/secrets`);
    cy.showAllResources();
    cy.wait(500);
    cy.get('secrets-datatable').within(() => {
      cy.getResourceNames('secret').then((resourceNames) => expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[6]));
    });

    // Read all types of resources
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/stacks`);
    cy.wait(1000);
    cy.get('stacks-datatable').within(() => {
      cy.getResourceNames('stack').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[0]).and.to.not.contain('adminstack').and.to.contain('publicstack');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/services`);
    cy.wait(500);
    cy.get('services-datatable').within(() => {
      cy.getResourceNames('service').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[1]).and.to.not.contain('adminservice').and.to.contain('publicservice');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/containers`);
    cy.wait(500);
    cy.get('containers-datatable').within(() => {
      cy.getResourceNames('container').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[2]).and.to.not.contain('admincontainer').and.to.contain('publiccontainer');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/networks`);
    cy.wait(1000);
    cy.get('networks-datatable').within(() => {
      cy.getResourceNames('network').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[3]).and.to.not.contain('adminnetwork').and.to.contain('publicstack');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/volumes`);
    cy.wait(2000);
    cy.get('volumes-datatable').within(() => {
      cy.getResourceNames('volume').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[4]).and.to.not.contain('adminvolume').and.to.contain('publicvolume');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/configs`);
    cy.wait(1500);
    cy.get('configs-datatable').within(() => {
      cy.getResourceNames('config').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[5]).and.to.not.contain('adminconfig').and.to.contain('publicconfig');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/secrets`);
    cy.wait(500);
    cy.get('secrets-datatable').within(() => {
      cy.getResourceNames('secret').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[6]).and.to.not.contain('adminsecret').and.to.contain('publicsecret');
      });
    });

    // Update all types of resources that can be updated and are owned or public
    cy.updateStack(STATEOBJECT.USER_RESOURCES[0]);
    cy.updateStack('publicstack');
    cy.updateService(STATEOBJECT.USER_RESOURCES[1]);
    cy.updateService('publicservice');
    cy.updateContainer(STATEOBJECT.USER_RESOURCES[2]);
    cy.updateContainer('publiccontainer');

    // Delete all types of resources owned or public
    cy.deleteStack('frontend', STATEOBJECT.USER_RESOURCES[0]);
    cy.deleteStack('frontend', 'publicstack');
    cy.get('stacks-datatable').within(() => {
      cy.getResourceNames('stack').then((resourceNames) => {
        expect(resourceNames).to.not.contain(STATEOBJECT.USER_RESOURCES[0]).and.to.not.contain('publicstack');
      });
    });

    cy.deleteService('frontend', STATEOBJECT.USER_RESOURCES[1]);
    cy.deleteService('frontend', 'publicservice');
    cy.get('services-datatable').within(() => {
      cy.getResourceNames('service').then((resourceNames) => {
        expect(resourceNames).to.not.contain(STATEOBJECT.USER_RESOURCES[1]).and.to.not.contain('adminservice').and.to.not.contain('publicservice');
      });
    });

    cy.deleteContainer('frontend', STATEOBJECT.USER_RESOURCES[2]);
    cy.deleteContainer('frontend', 'publiccontainer');
    cy.get('containers-datatable').within(() => {
      cy.getResourceNames('container').then((resourceNames) => {
        expect(resourceNames).to.not.contain(STATEOBJECT.USER_RESOURCES[2]).and.to.not.contain('publiccontainer');
      });
    });

    cy.deleteNetwork('frontend', STATEOBJECT.USER_RESOURCES[3]);
    cy.deleteNetwork('frontend', 'publicnetwork');
    cy.get('networks-datatable').within(() => {
      cy.getResourceNames('network').then((resourceNames) => {
        expect(resourceNames).to.not.contain(STATEOBJECT.USER_RESOURCES[3]).and.to.not.contain('publicnetwork');
      });
    });

    cy.deleteVolume('frontend', STATEOBJECT.USER_RESOURCES[4]);
    cy.deleteVolume('frontend', 'publicvolume');
    cy.get('volumes-datatable').within(() => {
      cy.getResourceNames('volumes').then((resourceNames) => {
        expect(resourceNames).to.not.contain(STATEOBJECT.USER_RESOURCES[4]).and.to.not.contain('publicvolume');
      });
    });

    cy.deleteConfig('frontend', STATEOBJECT.USER_RESOURCES[5]);
    cy.deleteConfig('frontend', 'publicconfig');
    cy.get('configs-datatable').within(() => {
      cy.getResourceNames('configs').then((resourceNames) => {
        expect(resourceNames).to.not.contain(STATEOBJECT.USER_RESOURCES[5]).and.to.not.contain('publicconfig');
      });
    });

    cy.deleteSecret('frontend', STATEOBJECT.USER_RESOURCES[6]);
    cy.deleteSecret('frontend', 'publicsecret');
    cy.get('secrets-datatable').within(() => {
      cy.getResourceNames('secrets').then((resourceNames) => {
        expect(resourceNames).to.not.contain(STATEOBJECT.USER_RESOURCES[6]).and.to.not.contain('publicsecret');
      });
    });
  }

  // If user has Read-only role:
  if (role == 'Read-only user') {
    cy.log(`Asserting for ${role}`);
    // Read all types of resources
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/stacks`);
    cy.wait(1000);
    cy.get('stacks-datatable').within(() => {
      cy.getResourceNames('stack').then((resourceNames) => {
        expect(resourceNames).to.not.contain('adminstack').and.to.contain('publicstack');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/services`);
    cy.wait(500);
    cy.get('services-datatable').within(() => {
      cy.getResourceNames('service').then((resourceNames) => {
        expect(resourceNames).to.not.contain('adminservice').and.to.contain('publicservice');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/containers`);
    cy.wait(500);
    cy.get('containers-datatable').within(() => {
      cy.getResourceNames('container').then((resourceNames) => {
        expect(resourceNames).to.not.contain('admincontainer').and.to.contain('publiccontainer');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/networks`);
    cy.wait(1000);
    cy.get('networks-datatable').within(() => {
      cy.getResourceNames('network').then((resourceNames) => {
        expect(resourceNames).to.not.contain('adminnetwork').and.to.contain('publicstack');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/volumes`);
    cy.wait(2000);
    cy.get('volumes-datatable').within(() => {
      cy.getResourceNames('volume').then((resourceNames) => {
        expect(resourceNames).to.not.contain('adminvolume').and.to.contain('publicvolume');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/configs`);
    cy.wait(1500);
    cy.get('configs-datatable').within(() => {
      cy.getResourceNames('config').then((resourceNames) => {
        expect(resourceNames).to.not.contain('adminconfig').and.to.contain('publicconfig');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/secrets`);
    cy.wait(500);
    cy.get('secrets-datatable').within(() => {
      cy.getResourceNames('secret').then((resourceNames) => {
        expect(resourceNames).to.not.contain('adminsecret').and.to.contain('publicsecret');
      });
    });
  }
});

Cypress.Commands.add('validateDockerStandaloneAbilities', (endpointName, role) => {
  cy.route2({ method: 'GET', path: '**/stacks*' }).as('validateAbilities:stacks');
  // TEST RESOURCE SETUP
  // create all type of resource as admin
  cy.auth('frontend', 'admin', 'portainer');
  cy.selectEndpoint(endpointName, 'Docker Standalone');
  cy.createStack('frontend', 'adminstack');
  cy.createContainer('frontend', 'admincontainer');
  cy.createNetwork('frontend', 'adminnetwork');
  cy.createVolume('frontend', 'adminvolume');

  // create all types of resources with public ownership
  cy.createStack('frontend', 'publicstack', 'public');
  cy.createContainer('frontend', 'publiccontainer', 'public');
  cy.createNetwork('frontend', 'publicnetwork', 'public');
  cy.createVolume('frontend', 'publicolume', 'public');

  cy.logout('admin');
  cy.auth('frontend', 'rbac-user', 'portainer');
  cy.selectEndpoint(endpointName, 'Docker Standalone');

  if (role == 'Endpoint administrator') {
    // Create all types of resources
    STATEOBJECT.ACTIVE_RESOURCE = 'stack-' + new Date().valueOf();
    cy.createStack('frontend', STATEOBJECT.ACTIVE_RESOURCE);
    STATEOBJECT.USER_RESOURCES[0] = STATEOBJECT.ACTIVE_RESOURCE;
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/stacks`);
    cy.showAllResources();
    cy.wait(1000);
    cy.get('stacks-datatable').within(() => {
      cy.getResourceNames('stack').then((resourceNames) => expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[0]));
    });

    STATEOBJECT.ACTIVE_RESOURCE = 'container-' + new Date().valueOf();
    cy.createContainer('frontend', STATEOBJECT.ACTIVE_RESOURCE);
    STATEOBJECT.USER_RESOURCES[1] = STATEOBJECT.ACTIVE_RESOURCE;
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/containers`);
    cy.showAllResources();
    cy.wait(500);
    cy.get('containers-datatable').within(() => {
      cy.getResourceNames('container').then((resourceNames) => expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[1]));
    });

    STATEOBJECT.ACTIVE_RESOURCE = 'network-' + new Date().valueOf();
    cy.createNetwork('frontend', STATEOBJECT.ACTIVE_RESOURCE);
    STATEOBJECT.USER_RESOURCES[2] = STATEOBJECT.ACTIVE_RESOURCE;
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/networks`);
    cy.showAllResources();
    cy.wait(1000);
    cy.get('networks-datatable').within(() => {
      cy.getResourceNames('network').then((resourceNames) => expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[2]));
    });

    STATEOBJECT.ACTIVE_RESOURCE = 'volume-' + new Date().valueOf();
    cy.createVolume('frontend', STATEOBJECT.ACTIVE_RESOURCE);
    STATEOBJECT.USER_RESOURCES[3] = STATEOBJECT.ACTIVE_RESOURCE;
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/volumes`);
    cy.showAllResources();
    cy.wait(2000);
    cy.get('volumes-datatable').within(() => {
      cy.getResourceNames('volume').then((resourceNames) => expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[3]));
    });

    // Read all types of resources
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/stacks`);
    cy.wait(1000);
    cy.get('stacks-datatable').within(() => {
      cy.getResourceNames('stack').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[0]).and.to.contain('adminstack').and.to.contain('publicstack');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/containers`);
    cy.wait(500);
    cy.get('containers-datatable').within(() => {
      cy.getResourceNames('container').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[1]).and.to.contain('admincontainer').and.to.contain('publiccontainer');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/networks`);
    cy.wait(1000);
    cy.get('networks-datatable').within(() => {
      cy.getResourceNames('network').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[2]).and.to.contain('adminnetwork').and.to.contain('publicstack');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/volumes`);
    cy.wait(2000);
    cy.get('volumes-datatable').within(() => {
      cy.getResourceNames('volume').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[3]).and.to.contain('adminvolume').and.to.contain('publicvolume');
      });
    });

    // Update all types of resources that can be updated
    cy.updateStack(STATEOBJECT.USER_RESOURCES[0]);
    cy.updateStack('adminstack');
    cy.updateStack('publicstack');
    cy.updateContainer(STATEOBJECT.USER_RESOURCES[1]);
    cy.updateContainer('admincontainer');

    // Delete all types of resources
    cy.deleteStack('frontend', STATEOBJECT.USER_RESOURCES[0]);
    cy.deleteStack('frontend', 'adminstack');
    cy.deleteStack('frontend', 'publicstack');
    cy.get('stacks-datatable').within(() => {
      cy.getResourceNames('stack').then((resourceNames) => {
        expect(resourceNames).to.not.contain(STATEOBJECT.USER_RESOURCES[0]).and.to.not.contain('adminstack').and.to.not.contain('publicstack');
      });
    });

    cy.deleteContainer('frontend', STATEOBJECT.USER_RESOURCES[1]);
    cy.deleteContainer('frontend', 'admincontainer');
    cy.deleteContainer('frontend', 'publiccontainer');
    cy.get('containers-datatable').within(() => {
      cy.getResourceNames('container').then((resourceNames) => {
        expect(resourceNames).to.not.contain(STATEOBJECT.USER_RESOURCES[1]).and.to.not.contain('admincontainer').and.to.not.contain('publiccontainer');
      });
    });

    cy.deleteNetwork('frontend', STATEOBJECT.USER_RESOURCES[2]);
    cy.deleteNetwork('frontend', 'adminnetwork');
    cy.deleteNetwork('frontend', 'publicnetwork');
    cy.get('networks-datatable').within(() => {
      cy.getResourceNames('network').then((resourceNames) => {
        expect(resourceNames).to.not.contain(STATEOBJECT.USER_RESOURCES[2]).and.to.not.contain('adminnetwork').and.to.not.contain('publicnetwork');
      });
    });

    cy.deleteVolume('frontend', STATEOBJECT.USER_RESOURCES[3]);
    cy.deleteVolume('frontend', 'adminvolume');
    cy.deleteVolume('frontend', 'publicvolume');
    cy.get('volumes-datatable').within(() => {
      cy.getResourceNames('volumes').then((resourceNames) => {
        expect(resourceNames).to.not.contain(STATEOBJECT.USER_RESOURCES[3]).and.to.not.contain('adminvolume').and.to.not.contain('publicvolume');
      });
    });
  }

  // If user has Helpdesk role:
  if (role == 'Helpdesk') {
    cy.log(`Asserting for ${role}`);
    cy.auth('frontend', 'rbac-user', 'portainer');
    cy.selectEndpoint(endpointName, 'Docker Standalone');
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/stacks`);
    cy.wait(1000);
    cy.get('stacks-datatable').within(() => {
      cy.getResourceNames('stack').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[0]).and.to.contain('adminstack').and.to.contain('publicstack');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/containers`);
    cy.wait(500);
    cy.get('containers-datatable').within(() => {
      cy.getResourceNames('container').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[1]).and.to.contain('admincontainer').and.to.contain('publiccontainer');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/networks`);
    cy.wait(1000);
    cy.get('networks-datatable').within(() => {
      cy.getResourceNames('network').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[2]).and.to.contain('adminnetwork').and.to.contain('publicstack');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/volumes`);
    cy.wait(2000);
    cy.get('volumes-datatable').within(() => {
      cy.getResourceNames('volume').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[3]).and.to.contain('adminvolume').and.to.contain('publicvolume');
      });
    });
  }

  // If user has Standard user role:
  if (role == 'Standard user') {
    cy.log(`Asserting for ${role}`);
    // Create all types of resources
    STATEOBJECT.ACTIVE_RESOURCE = 'stack-' + new Date().valueOf();
    cy.createStack('frontend', STATEOBJECT.ACTIVE_RESOURCE);
    STATEOBJECT.USER_RESOURCES[0] = STATEOBJECT.ACTIVE_RESOURCE;
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/stacks`);
    cy.showAllResources();
    cy.wait(1000);
    cy.get('stacks-datatable').within(() => {
      cy.getResourceNames('stack').then((resourceNames) => expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[0]));
    });

    STATEOBJECT.ACTIVE_RESOURCE = 'container-' + new Date().valueOf();
    cy.createContainer('frontend', STATEOBJECT.ACTIVE_RESOURCE);
    STATEOBJECT.USER_RESOURCES[1] = STATEOBJECT.ACTIVE_RESOURCE;
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/containers`);
    cy.showAllResources();
    cy.wait(500);
    cy.get('containers-datatable').within(() => {
      cy.getResourceNames('container').then((resourceNames) => expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[1]));
    });

    STATEOBJECT.ACTIVE_RESOURCE = 'network-' + new Date().valueOf();
    cy.createNetwork('frontend', STATEOBJECT.ACTIVE_RESOURCE);
    STATEOBJECT.USER_RESOURCES[2] = STATEOBJECT.ACTIVE_RESOURCE;
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/networks`);
    cy.showAllResources();
    cy.wait(1000);
    cy.get('networks-datatable').within(() => {
      cy.getResourceNames('network').then((resourceNames) => expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[2]));
    });

    STATEOBJECT.ACTIVE_RESOURCE = 'volume-' + new Date().valueOf();
    cy.createVolume('frontend', STATEOBJECT.ACTIVE_RESOURCE);
    STATEOBJECT.USER_RESOURCES[3] = STATEOBJECT.ACTIVE_RESOURCE;
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/volumes`);
    cy.showAllResources();
    cy.wait(2000);
    cy.get('volumes-datatable').within(() => {
      cy.getResourceNames('volume').then((resourceNames) => expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[3]));
    });

    // Read all types of resources
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/stacks`);
    cy.wait(1000);
    cy.get('stacks-datatable').within(() => {
      cy.getResourceNames('stack').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[0]).and.to.not.contain('adminstack').and.to.contain('publicstack');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/containers`);
    cy.wait(500);
    cy.get('containers-datatable').within(() => {
      cy.getResourceNames('container').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[1]).and.to.not.contain('admincontainer').and.to.contain('publiccontainer');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/networks`);
    cy.wait(1000);
    cy.get('networks-datatable').within(() => {
      cy.getResourceNames('network').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[2]).and.to.not.contain('adminnetwork').and.to.contain('publicstack');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/volumes`);
    cy.wait(2000);
    cy.get('volumes-datatable').within(() => {
      cy.getResourceNames('volume').then((resourceNames) => {
        expect(resourceNames).to.contain(STATEOBJECT.USER_RESOURCES[3]).and.to.not.contain('adminvolume').and.to.contain('publicvolume');
      });
    });

    // Update all types of resources that can be updated and are owned or public
    cy.updateStack(STATEOBJECT.USER_RESOURCES[0]);
    cy.updateStack('publicstack');
    cy.updateContainer(STATEOBJECT.USER_RESOURCES[1]);
    cy.updateContainer('publiccontainer');

    // Delete all types of resources owned or public
    cy.deleteStack('frontend', STATEOBJECT.USER_RESOURCES[0]);
    cy.deleteStack('frontend', 'publicstack');
    cy.get('stacks-datatable').within(() => {
      cy.getResourceNames('stack').then((resourceNames) => {
        expect(resourceNames).to.not.contain(STATEOBJECT.USER_RESOURCES[0]).and.to.not.contain('publicstack');
      });
    });

    cy.deleteContainer('frontend', STATEOBJECT.USER_RESOURCES[1]);
    cy.deleteContainer('frontend', 'publiccontainer');
    cy.get('containers-datatable').within(() => {
      cy.getResourceNames('container').then((resourceNames) => {
        expect(resourceNames).to.not.contain(STATEOBJECT.USER_RESOURCES[1]).and.to.not.contain('publiccontainer');
      });
    });

    cy.deleteNetwork('frontend', STATEOBJECT.USER_RESOURCES[2]);
    cy.deleteNetwork('frontend', 'publicnetwork');
    cy.get('networks-datatable').within(() => {
      cy.getResourceNames('network').then((resourceNames) => {
        expect(resourceNames).to.not.contain(STATEOBJECT.USER_RESOURCES[2]).and.to.not.contain('publicnetwork');
      });
    });

    cy.deleteVolume('frontend', STATEOBJECT.USER_RESOURCES[3]);
    cy.deleteVolume('frontend', 'publicvolume');
    cy.get('volumes-datatable').within(() => {
      cy.getResourceNames('volumes').then((resourceNames) => {
        expect(resourceNames).to.not.contain(STATEOBJECT.USER_RESOURCES[3]).and.to.not.contain('publicvolume');
      });
    });
  }

  // If user has Read-only role:
  if (role == 'Read-only user') {
    cy.log(`Asserting for ${role}`);
    // Read all types of resources
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/stacks`);
    cy.wait(1000);
    cy.get('stacks-datatable').within(() => {
      cy.getResourceNames('stack').then((resourceNames) => {
        expect(resourceNames).to.not.contain('adminstack').and.to.contain('publicstack');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/containers`);
    cy.wait(500);
    cy.get('containers-datatable').within(() => {
      cy.getResourceNames('container').then((resourceNames) => {
        expect(resourceNames).to.not.contain('admincontainer').and.to.contain('publiccontainer');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/networks`);
    cy.wait(1000);
    cy.get('networks-datatable').within(() => {
      cy.getResourceNames('network').then((resourceNames) => {
        expect(resourceNames).to.not.contain('adminnetwork').and.to.contain('publicstack');
      });
    });

    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/volumes`);
    cy.wait(2000);
    cy.get('volumes-datatable').within(() => {
      cy.getResourceNames('volume').then((resourceNames) => {
        expect(resourceNames).to.not.contain('adminvolume').and.to.contain('publicvolume');
      });
    });
  }
});
