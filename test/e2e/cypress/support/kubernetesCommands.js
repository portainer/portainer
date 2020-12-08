import 'cypress-wait-until';
import _ from 'lodash-es';
import { STATEOBJECT } from './vars.js';

/*
 * Resource Pool
 */

// Create a Resource Pool (Kubernetes)
Cypress.Commands.add('createResourcePool', (location, resourceName, waitForRedirection = true) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/kubernetes/pools/new`);
    cy.waitUntil(() => cy.get('input[name=pool_name]'))
      .click()
      .type(resourceName);

    // set memory limit to 512
    cy.waitUntil(() => cy.get('input[name=memory_limit]'))
      .click()
      .type('512');
    cy.contains('Create resource pool').click();
    // Wait for redirection to applications view
    if (waitForRedirection) cy.waitUntil(() => cy.contains('Resource pool list', { timeout: 120000 }));
  }
});

// Delete a Resource Pool (Kubernetes)
Cypress.Commands.add('deleteResourcePool', (location, resourceNames) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/kubernetes/pools`);
    cy.waitUntil(() => cy.contains('Resource pool list', { timeout: 120000 })).showAllResources();
    selectItem(resourceNames);
    cy.contains('Remove').click();
    cy.get('div.modal-dialog button').within(() => {
      cy.contains('Remove').click();
    });

    cy.waitUntil(() => cy.contains('Resource pool successfully removed'));

    // config page will reload after all configs removed. wait for the reload.
    cy.wait('@reloadConfigPage');
  } else {
  }
});

// Add an access to a Resource Pool (Kubernetes)
Cypress.Commands.add('addResourcePoolAccess', (resourceName, entityName, entityType) => {
  cy.route2({ method: 'GET', path: '**/teams' }).as('addResourcePoolAccess:teams');
  cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/kubernetes/pools`);
  cy.waitUntil(() => cy.contains('Resource pool list', { timeout: 120000 })).showAllResources();
  cy.contains(new RegExp('^' + resourceName + '$', 'g'))
    .closest('tr')
    .within(() => {
      cy.contains('Manage access').click();
    });
  cy.wait('@addResourcePoolAccess:teams');
  cy.get('.multiSelect > .ng-binding').click();
  // Assign based on entity type
  var type;
  if (entityType == 'team') {
    type = 'fa-users';
  } else {
    type = 'fa-user';
  }
  cy.get('.' + type)
    .parent()
    .contains(entityName)
    .click();

  cy.get('.multiSelect > .ng-binding').click();

  // Click Create access button
  cy.get('button[type=submit]').click();
  // Wait until accesses updated
  cy.waitUntil(() => cy.contains('Access successfully created'));
  cy.wait('@addResourcePoolAccess:teams');
});

// Remove access to a Resource Pool (Kubernetes)
Cypress.Commands.add('removeResourcePoolAccess', (resourceName, entityName) => {
  cy.route2({ method: 'GET', path: '**/teams' }).as('removeResourcePoolAccess:teams');
  cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/kubernetes/pools`);
  cy.waitUntil(() => cy.contains('Resource pool list', { timeout: 120000 })).showAllResources();
  cy.contains(new RegExp('^' + resourceName + '$', 'g'))
    .closest('tr')
    .within(() => {
      cy.contains('Manage access').click();
    });
  cy.wait('@removeResourcePoolAccess:teams');

  // Select the user/team
  cy.get('access-datatable').within(() => {
    cy.contains(entityName)
      .closest('tr')
      .within(() => {
        cy.get('input[type=checkbox]').click();
      });
  });

  // Click Remove button
  cy.get('button').contains('Remove').click();
  // Wait until accesses updated
  cy.waitUntil(() => cy.contains('Access successfully removed'));
  cy.wait('@removeResourcePoolAccess:teams');
});

// Use advanced deployment (Kubernetes)
Cypress.Commands.add('advancedDeployment', (location, resourcePool, deploymentType, waitForRedirection = true) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/kubernetes/deploy`);
    cy.selectResourcePool(resourcePool);
    // Directly set the value of the CodeMirror object to avoid messing with formatting
    cy.get('.CodeMirror')
      .first()
      .then((editor) => {
        cy.fixture('manifest.yaml').then((manifest) => editor[0].CodeMirror.setValue(manifest));
      });
    cy.get('button').contains('Deploy').click();
    // Wait for redirection to applications view
    if (waitForRedirection) cy.waitUntil(() => cy.contains('Application list', { timeout: 120000 }));
  }
});

Cypress.Commands.add('assertReadonlyResourcePoolTable', () => {
  assertReadonlyResourceTable('pools', 'kubernetes-resource-pools-datatable');
});

Cypress.Commands.add('assertExistResourcePools', (resourcesNames) => {
  assertExistResources(resourcesNames, 'pools', 'kubernetes-resource-pools-datatable');
});

Cypress.Commands.add('assertNotExistResourcePools', (resourcesNames) => {
  assertNotExistResources(resourcesNames, 'pools', 'kubernetes-resource-pools-datatable');
});

/*
 * Application
 */

// Create an Application (Kubernetes)
Cypress.Commands.add('createApplication', (location, resourceName, pool, waitForRedirection = true) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/kubernetes/applications/new`);
    cy.waitUntil(() => cy.get('input[name=application_name]'))
      .click()
      .type(resourceName);
    cy.get('input[name=container_image]').click().type('nginx');
    cy.get('select').select(pool);
    cy.contains('Deploy application').click();
    // Wait for redirection to applications view
    if (waitForRedirection) cy.waitUntil(() => cy.contains('Application list', { timeout: 120000 }));
  }
});

// Update an Application (Kubernetes)
Cypress.Commands.add('updateApplication', (resourceName, resourcePool) => {
  cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/kubernetes/applications`);
  cy.waitUntil(() => cy.contains('Application list', { timeout: 120000 })).showAllResources();
  cy.get('kubernetes-applications-datatable').within(() => {
    cy.contains(new RegExp('^' + resourceName + '$', 'g'))
      .closest('td')
      .siblings()
      .eq(1)
      .contains(new RegExp('^' + resourcePool + '$', 'g'))
      .closest('tr')
      .within(() => {
        cy.contains(new RegExp('^' + resourceName + '$', 'g')).click();
      });
  });
  cy.waitUntil(() => cy.contains('Edit this application')).click();
  cy.waitUntil(() => cy.get('input[name="stack_name"][placeholder="myStack"]', { timeout: 120000 }))
    .clear()
    .type('cypress' + new Date().valueOf());
  cy.get('button').contains('Update application').click();
  cy.get('button[class="btn btn-warning bootbox-accept"]').click();
  cy.waitUntil(() => cy.contains('Application successfully updated'));
});

// Delete an Application (Kubernetes)
Cypress.Commands.add('deleteApplication', (location, resourceName, resourcePool) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/kubernetes/applications`);
    cy.waitUntil(() => cy.contains('Application list', { timeout: 120000 })).showAllResources();
    cy.contains(new RegExp('^' + resourcePool + '$', 'g'))
      .closest('td')
      .siblings()
      .contains(new RegExp('^' + resourceName + '$', 'g'))
      .closest('tr')
      .within(() => {
        cy.get('input[type=checkbox]').click();
      });
    cy.contains('Remove').click();
    cy.get('div.modal-dialog button').within(() => {
      cy.contains('Remove').click();
    });
    cy.waitUntil(() => cy.contains('Application successfully removed'));
  } else {
  }
});

Cypress.Commands.add('assertReadonlyApplicationTable', () => {
  assertReadonlyResourceTable('applications', 'kubernetes-applications-datatable');
});

Cypress.Commands.add('assertExistApplications', (resourcesNames) => {
  assertExistResources(resourcesNames, 'applications', 'kubernetes-applications-datatable');
});

Cypress.Commands.add('assertNotExistApplications', (resourcesNames) => {
  assertNotExistResources(resourcesNames, 'applications', 'kubernetes-applications-datatable');
});

/*
 * Config
 */

// Create a Config (Kubernetes)
Cypress.Commands.add('createKubeConfig', (location, resourceName, pool, waitForRedirection = true) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/kubernetes/configurations/new`);
    cy.waitUntil(() => cy.get('input[name=configuration_name]'))
      .click()
      .type(resourceName);
    cy.get('select').select(pool);
    cy.get('input[name=configuration_data_key_0]').click().type('config');
    cy.get('textarea[name=configuration_data_value_0]').click().type('This is a config');

    // cy.contains('Create configuration').click();
    cy.get('button').within(() => {
      cy.contains('Create configuration').click();
    });

    // Wait for redirection to configurations view
    if (waitForRedirection) cy.waitUntil(() => cy.contains('Configuration list', { timeout: 120000 }));
  }
});

// Update a Config (Kubernetes)
Cypress.Commands.add('updateKubeConfig', (resourceName, resourcePool) => {
  cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/kubernetes/configurations`);
  cy.waitUntil(() => cy.contains('Configuration list', { timeout: 120000 })).showAllResources();
  cy.get('kubernetes-configurations-datatable').within(() => {
    cy.contains(new RegExp('^' + resourceName + '$', 'g'))
      .closest('td')
      .siblings()
      .eq(0)
      .contains(new RegExp('^' + resourcePool + '$', 'g'))
      .closest('tr')
      .within(() => {
        cy.contains(new RegExp('^' + resourceName + '$', 'g')).click();
      });
  });
  cy.waitUntil(() => cy.get('#configuration_data_value_0', { timeout: 120000 }))
    .clear()
    .type('cypress' + new Date().valueOf());
  cy.get('button').contains('Update configuration').click();
  cy.waitUntil(() => cy.contains('Configuration succesfully updated'));
});
function selectItem(itemNames) {
  itemNames = Array.isArray(itemNames) ? itemNames : [itemNames];
  itemNames.forEach((itemName) => {
    cy.contains(new RegExp('^' + itemName + '$', 'g'))
      .closest('tr')
      .within(() => {
        cy.get('input[type=checkbox]').click();
      });
  });
}

// Delete a Config (Kubernetes)
Cypress.Commands.add('deleteKubeConfig', (location, resourceName) => {
  cy.route2({ method: 'GET', path: '**/namespaces' }).as('reloadConfigPage');
  if (location == 'frontend') {
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/kubernetes/configurations`);
    cy.waitUntil(() => cy.contains('Configuration list', { timeout: 120000 })).showAllResources();
    selectItem(resourceName);
    cy.contains('Remove').click();
    cy.get('div.modal-dialog button').within(() => {
      cy.contains('Remove').click();
    });
    // cy.waitUntil(() => cy.contains('Configurations successfully removed'));
    cy.wait('@reloadConfigPage');
  } else {
  }
});

Cypress.Commands.add('assertReadonlyConfigTable', () => {
  assertReadonlyResourceTable('configurations', 'kubernetes-configurations-datatable');
});

Cypress.Commands.add('assertExistConfigs', (resourcesNames) => {
  assertExistResources(resourcesNames, 'configurations', 'kubernetes-configurations-datatable');
});

Cypress.Commands.add('assertNotExistConfigs', (resourcesNames) => {
  assertNotExistResources(resourcesNames, 'configurations', 'kubernetes-configurations-datatable');
});

/*
 * Volume
 */

// Delete a Volume (Kubernetes)
Cypress.Commands.add('deleteKubeVolume', (location, resourceName) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/kubernetes/volumes`);
    cy.waitUntil(() => cy.contains('Volume list', { timeout: 120000 })).showAllResources();
    selectItem(resourceName);
    cy.contains('Remove').click();
    cy.waitUntil(() => cy.contains('Volume successfully removed'));
  } else {
  }
});

// Helper function to select a resource pool in a resource creation view
Cypress.Commands.add('selectResourcePool', (resourcePool) => {
  cy.get('.col-lg-11 > .form-control').select(resourcePool);
});
Cypress.Commands.add('assertReadonlyVolume', () => {
  cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/kubernetes/volumes`);
  cy.get('kubernetes-volumes-datatable').within(() => {
    cy.contains('Remove').should('not.visible');
    cy.contains('Add resource pool').should('not.visible');
  });
});

/*
  Helpers
 */

function assertReadonlyResourceTable(urlSuffix, dataTableTag) {
  cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/kubernetes/${urlSuffix}`);
  cy.get(dataTableTag).within(() => {
    cy.contains('Remove').should('not.visible');
    cy.contains('Add resource pool').should('not.visible');
  });
}

function assertExistResources(resourcesNames, urlSuffix, tableTag) {
  cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/kubernetes/${urlSuffix}`);
  // cy.showAllResources();
  cy.wait(1000);
  cy.get(tableTag).within(() => {
    resourcesNames.forEach((resourceName) => {
      cy.contains(resourceName);
    });
  });
}

function assertNotExistResources(resourcesNames, urlSuffix, tableTag) {
  cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/kubernetes/${urlSuffix}`);
  // cy.showAllResources();
  cy.wait(1000);
  cy.get(tableTag).within(() => {
    resourcesNames.forEach((resourceName) => {
      cy.contains(resourceName).should('not.exist');
    });
  });
}
