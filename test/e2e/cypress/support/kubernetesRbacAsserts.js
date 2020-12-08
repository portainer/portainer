import 'cypress-wait-until';
import _ from 'lodash-es';
import { STATEOBJECT } from './vars.js';

function assertEndpointAdministrator(endpointName) {
  // login as admin
  cy.clearBrowserToken();
  cy.auth('frontend', 'admin', 'portainer');

  cy.selectEndpoint(endpointName, endpointName);

  // create all type of resource as admin
  cy.createResourcePool('frontend', 'admin-pool');
  cy.createApplication('frontend', 'admin-app-in-admin-pool', 'admin-pool');
  cy.createKubeConfig('frontend', 'admin-config-in-admin-pool', 'admin-pool');

  // login as rbac-user
  cy.logout('admin');
  cy.auth('frontend', 'rbac-user', 'portainer');

  cy.selectEndpoint(endpointName, endpointName);

  // create resourcepool
  cy.createResourcePool('frontend', 'user-pool');

  // create application
  cy.createApplication('frontend', 'user-app-in-admin-pool', 'admin-pool');
  cy.createApplication('frontend', 'user-app-in-user-pool', 'user-pool');

  // create config
  cy.createKubeConfig('frontend', 'user-config-in-user-pool', 'user-pool');
  cy.createKubeConfig('frontend', 'user-config-in-admin-pool', 'admin-pool');

  // Read all types of resources
  cy.assertExistResourcePools(['admin-pool', 'user-pool']);
  cy.assertExistApplications(['admin-app-in-admin-pool', 'user-app-in-admin-pool', 'user-app-in-user-pool']);
  cy.assertExistConfigs(['admin-config-in-admin-pool', 'user-config-in-admin-pool', 'user-config-in-user-pool']);

  // Delete all types of resources
  cy.deleteKubeConfig('frontend', ['admin-config-in-admin-pool', 'user-config-in-admin-pool', 'user-config-in-user-pool']);
  cy.deleteApplicaton('frontend', ['admin-app-in-admin-pool', 'user-app-in-admin-pool', 'user-app-in-user-pool']);
  cy.deleteResourcePool('frontend', ['admin-pool', 'user-pool']);

  // wait for toast disappear so that logout button can be clicked
  cy.wait(5000);
  cy.logout('rbac-user');
  cy.pause();
}

function assertHelpdesk(endpointName) {
  // login as admin
  cy.clearBrowserToken();
  cy.auth('frontend', 'admin', 'portainer');

  cy.selectEndpoint(endpointName, endpointName);

  // create all type of resource as admin
  cy.createResourcePool('frontend', 'admin-pool');
  cy.createApplication('frontend', 'admin-app-in-admin-pool', 'admin-pool');
  cy.createKubeConfig('frontend', 'admin-config-in-admin-pool', 'admin-pool');

  // login as rbac-user
  cy.logout('admin');
  cy.auth('frontend', 'rbac-user', 'portainer');

  cy.selectEndpoint(endpointName, endpointName);

  // assert all resource tables are readonly
  cy.assertReadonlyResourcePoolTable();
  cy.assertApplicationTableReadonly();
  cy.assertReadonlyConfigTable();
  cy.assertReadonlyVolume();

  // Read all types of resources
  cy.assertExistResourcePools(['default', 'admin-pool']);
  cy.assertExistApplications(['admin-app-in-admin-pool']);
  cy.assertExistConfigs(['admin-config-in-admin-pool']);

  // login as admin
  cy.logout('rbac-user');
  cy.auth('frontend', 'admin', 'portainer');

  // Delete all types of resources
  cy.deleteResourcePool('frontend', ['admin-pool']);

  // wait for toast disappear so that logout button can be clicked
  cy.wait(5000);
  cy.logout('admin');
}

function assertStandardUser(endpointName) {
  // login as admin
  cy.clearBrowserToken();
  cy.auth('frontend', 'admin', 'portainer');

  cy.selectEndpoint(endpointName, endpointName);

  // create all type of resource as admin
  cy.createResourcePool('frontend', 'admin-pool');
  cy.createApplication('frontend', 'admin-app-in-admin-pool', 'admin-pool');
  cy.createKubeConfig('frontend', 'admin-config-in-admin-pool', 'admin-pool');

  // login as rbac-user
  cy.logout('admin');
  cy.auth('frontend', 'rbac-user', 'portainer');

  cy.selectEndpoint(endpointName, endpointName);

  // assert pool
  cy.assertReadonlyResourcePoolTable();
  cy.assertExistResourcePools(['default']);
  cy.assertNotExistResourcePools(['admin-pool']);

  // assert app
  cy.createApplication('frontend', 'user-app-in-default-pool', 'default');
  cy.assertExistApplications(['user-app-in-default-pool']);
  cy.assertNotExistApplications(['admin-app-in-admin-pool']);

  // assert config
  cy.createKubeConfig('frontend', 'user-config-in-default-pool', 'default');
  cy.assertExistApplications(['user-config-in-default-pool']);
  cy.assertNotExistApplications(['admin-config-in-admin-pool']);

  // delete
  cy.deleteKubeConfig('frontend', ['user-config-in-default-pool']);
  cy.deleteApplicaton('frontend', ['user-app-in-default-pool']);

  // login as admin
  cy.logout('rbac-user');
  cy.auth('frontend', 'admin', 'portainer');

  // Delete all types of resources
  cy.deleteResourcePool('frontend', ['admin-pool']);

  // wait for toast disappear so that logout button can be clicked
  cy.wait(5000);
  cy.logout('admin');
}

function assertReadOnlyUser(endpointName) {
  // login as admin
  cy.clearBrowserToken();
  cy.auth('frontend', 'admin', 'portainer');

  cy.selectEndpoint(endpointName, endpointName);

  // create all type of resource as admin
  cy.createResourcePool('frontend', 'admin-pool');
  cy.createApplication('frontend', 'admin-app-in-admin-pool', 'admin-pool');
  cy.createKubeConfig('frontend', 'admin-config-in-admin-pool', 'admin-pool');

  // login as rbac-user
  cy.logout('admin');
  cy.auth('frontend', 'rbac-user', 'portainer');

  cy.selectEndpoint(endpointName, endpointName);

  // assert pool
  cy.assertReadonlyResourcePoolTable();
  cy.assertExistResourcePools(['default']);
  cy.assertNotExistResourcePools(['admin-pool']);

  // assert app
  cy.assertReadonlyApplicationTable();
  cy.assertNotExistApplications(['admin-app-in-admin-pool']);

  // assert config
  cy.assertReadonlyConfigTable();
  cy.assertNotExistConfigs(['admin-config-in-admin-pool']);

  // login as admin
  cy.logout('rbac-user');
  cy.auth('frontend', 'admin', 'portainer');

  // Delete all types of resources
  cy.deleteResourcePool('frontend', ['admin-pool']);

  // wait for toast disappear so that logout button can be clicked
  cy.wait(5000);
  cy.logout('admin');
}

Cypress.Commands.add('validateKubernetesAbilities', (endpointName, role) => {
  if (role == 'Endpoint administrator') {
    assertEndpointAdministrator(endpointName);
  }

  if (role === 'Helpdesk') {
    assertHelpdesk(endpointName);
  }

  if (role === 'Standard user') {
    cy.assertStandardUser(endpointName);
  }

  if (role === 'Read-only user') {
    cy.assertReadonlyResourcePoolTable(endpointName);
  }

  cy.log('validateKubernetesAbilities is done');
});
