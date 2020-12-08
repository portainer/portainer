import 'cypress-wait-until';
import _ from 'lodash-es';
import { STATEOBJECT } from './vars.js';

// Create a Stack (Docker)
Cypress.Commands.add('createStack', (location, resourceName, ownership = '', users = [], teams = [], waitForRedirection = true) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/stacks/newstack`);
    cy.waitUntil(() => cy.get('#stack_name'))
      .click()
      .type(resourceName);
    if (STATEOBJECT.ACTIVE_ENDPOINT_TYPE == '1') {
      cy.get('.CodeMirror-scroll')
        .click({ force: true })
        .type("version: '2'")
        .type('{enter}')
        .type('services:')
        .type('{enter}')
        .type('  test:')
        .type('{enter}')
        .type('  image: nginx');
    } else {
      cy.get('.CodeMirror-scroll')
        .click({ force: true })
        .type("version: '3'")
        .type('{enter}')
        .type('services:')
        .type('{enter}')
        .type('  test:')
        .type('{enter}')
        .type('  image: nginx');
    }
    cy.setOwnership(ownership, users, teams);
    cy.contains('Deploy the stack').click();
    // Wait for redirection to stacks view
    if (waitForRedirection) cy.waitUntil(() => cy.contains('Stacks list', { timeout: 120000 }));
  } else {
    cy.request({
      method: 'POST',
      url: `/api/stacks?endpointId=${STATEOBJECT.ACTIVE_ENDPOINT_ID}&method=string&type=1`,
      auth: {
        bearer: STATEOBJECT.USER_TOKENS['admin'],
      },
      body: { Name: resourceName, SwarmID: STATEOBJECT.ACTIVE_SWARM_ID, StackFileContent: "version: '3'\nservices:\n  test:\n    image: nginx", Env: [] },
    })
      .its('body')
      .then((response) => {
        cy.log(JSON.stringify(response));
      });
  }
});

// Update a Stack (Docker)
Cypress.Commands.add('updateStack', (resourceName) => {
  cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/stacks`);
  cy.waitUntil(() => cy.contains('Stacks list', { timeout: 120000 })).showAllResources();
  cy.get('stacks-datatable').within(() => {
    cy.contains(new RegExp('^' + resourceName + '$', 'g')).click();
  });
  cy.contains('Editor').click();
  if (STATEOBJECT.ACTIVE_ENDPOINT_TYPE == '1') {
    cy.get('.CodeMirror').type('{movetostart}').type('{selectall}').type('   image: httpd');
  }
  cy.contains('Update the stack').click();
});

// Delete a Stack (Docker)
Cypress.Commands.add('deleteStack', (location, resourceName) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/stacks`);
    cy.waitUntil(() => cy.contains('Stacks list', { timeout: 120000 })).showAllResources();
    cy.contains(new RegExp('^' + resourceName + '$', 'g'))
      .closest('tr')
      .within(() => {
        cy.get('input[type=checkbox]').click();
      });
    cy.contains('Remove').click();
    cy.get('.modal-dialog').within(() => {
      cy.get('button[class="btn btn-danger bootbox-accept"]').click();
    });
    cy.waitUntil(() => cy.contains('Stack successfully removed'));
  } else {
    cy.log('Delete stack via API');
  }
});

// Create a Service (Docker)
Cypress.Commands.add('createService', (location, resourceName, ownership = '', users = [], teams = [], waitForRedirection = true) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/services/new`);
    cy.waitUntil(() => cy.get('#service_name'))
      .click()
      .type(resourceName);
    cy.get('input[name=image_name]').type('nginx:alpine');
    cy.setOwnership(ownership, users, teams);
    cy.contains('Create the service').click();
    // Wait for redirection to services view
    if (waitForRedirection) cy.waitUntil(() => cy.contains('Service list', { timeout: 120000 }));
  }
});

// Update a Service (Docker)
Cypress.Commands.add('updateService', (resourceName) => {
  cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/services`);
  cy.waitUntil(() => cy.contains('Service list', { timeout: 120000 })).showAllResources();
  cy.get('services-datatable').within(() => {
    cy.contains(new RegExp('^' + resourceName + '$', 'g')).click();
  });
  cy.get('por-image-registry').scrollIntoView();
  cy.get('.margin-sm-top.col-sm-11 > .input-group > .form-control').type('nginx');
  cy.get('#service-container-image > rd-widget.ng-isolate-scope > .widget > rd-widget-footer.ng-scope > .widget-footer').click();
});

// Delete a Service (Docker)
Cypress.Commands.add('deleteService', (location, resourceName) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/services`);
    cy.waitUntil(() => cy.contains('Service list', { timeout: 120000 })).showAllResources();
    cy.contains(new RegExp('^' + resourceName + '$', 'g'))
      .closest('tr')
      .within(() => {
        cy.get('input[type=checkbox]').click();
      });
    cy.contains('Remove').click();
    cy.get('.modal-dialog').within(() => {
      cy.get('button[class="btn btn-danger bootbox-accept"]').click();
    });
    cy.waitUntil(() => cy.contains('Service successfully removed'));
  } else {
    cy.log('Delete service via API');
  }
});

Cypress.Commands.add('serviceLogs', (resourceName) => {
  cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/services`);
  cy.waitUntil(() => cy.contains('Service list', { timeout: 120000 })).showAllResources();
  cy.get('services-datatable').within(() => {
    cy.contains(new RegExp('^' + resourceName + '$', 'g')).click();
  });
  cy.contains('Service logs').click();
});

// Create a Container (Docker)
Cypress.Commands.add('createContainer', (location, resourceName, ownership = '', users = [], teams = [], waitForRedirection = true) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/containers/new`);
    cy.waitUntil(() => cy.get('#container_name'))
      .click()
      .type(resourceName);
    cy.get('input[name=image_name]').type('nginx:alpine');
    cy.setOwnership(ownership, users, teams);
    cy.contains('Deploy the container').click();
    // Wait for redirection to containers view
    if (waitForRedirection) cy.waitUntil(() => cy.contains('Container list', { timeout: 120000 }));
  }
});

// Update a Container (Docker)
Cypress.Commands.add('updateContainer', (resourceName) => {
  cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/containers`);
  cy.waitUntil(() => cy.contains('Container list', { timeout: 120000 })).showAllResources();
  cy.get('containers-datatable').within(() => {
    cy.contains(new RegExp('^' + resourceName + '$', 'g')).click();
  });
  cy.contains('Duplicate/Edit').click();
  cy.get('#image_name').clear().type('httpd');
  cy.contains('Deploy the container').click();
});

// Delete a Container (Docker)
Cypress.Commands.add('deleteContainer', (location, resourceName) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/containers`);
    cy.waitUntil(() => cy.contains('Container list', { timeout: 120000 })).showAllResources();
    cy.contains(new RegExp('^' + resourceName + '$', 'g'))
      .closest('tr')
      .within(() => {
        cy.get('input[type=checkbox]').click();
      });
    cy.contains('Remove').click();
    cy.get('.modal-dialog').within(() => {
      cy.get('button[class="btn btn-danger bootbox-accept"]').click();
    });
    cy.waitUntil(() => cy.contains('Container successfully removed'));
  } else {
    cy.log('Delete container via API');
  }
});

Cypress.Commands.add('containerLogs', (resourceName) => {
  cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/containers`);
  cy.waitUntil(() => cy.contains('Container list', { timeout: 120000 })).showAllResources();
  cy.contains(new RegExp('^' + resourceName + '$', 'g'))
    .closest('tr')
    .within(() => {
      cy.get('a[title="Logs"]').click();
    });
});

Cypress.Commands.add('containerInspect', (resourceName) => {
  cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/containers`);
  cy.waitUntil(() => cy.contains('Container list', { timeout: 120000 })).showAllResources();
  cy.contains(new RegExp('^' + resourceName + '$', 'g'))
    .closest('tr')
    .within(() => {
      cy.get('a[title="Inspect"]').click();
    });
});

Cypress.Commands.add('containerStats', (resourceName) => {
  cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/containers`);
  cy.waitUntil(() => cy.contains('Container list', { timeout: 120000 })).showAllResources();
  cy.contains(new RegExp('^' + resourceName + '$', 'g'))
    .closest('tr')
    .within(() => {
      cy.get('a[title="Stats"]').click();
    });
});

Cypress.Commands.add('containerConsole', (resourceName) => {
  cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/containers`);
  cy.waitUntil(() => cy.contains('Container list', { timeout: 120000 })).showAllResources();
  cy.contains(new RegExp('^' + resourceName + '$', 'g'))
    .closest('tr')
    .within(() => {
      cy.get('a[title="Exec Console"]').click();
    });
  cy.contains('Connect').click();
});

// Create a Network (Docker)
Cypress.Commands.add('createNetwork', (location, resourceName, ownership = '', users = [], teams = [], waitForRedirection = true) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/networks/new`);
    cy.waitUntil(() => cy.get('#network_name'))
      .click()
      .type(resourceName);
    cy.setOwnership(ownership, users, teams);
    cy.contains('Create the network').click();
    // Wait for redirection to networks view
    if (waitForRedirection) cy.waitUntil(() => cy.contains('Network list', { timeout: 120000 }));
  }
});

// Delete a Network (Docker)
Cypress.Commands.add('deleteNetwork', (location, resourceName) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/networks`);
    cy.waitUntil(() => cy.contains('Network list', { timeout: 120000 })).showAllResources();
    cy.contains(new RegExp('^' + resourceName + '$', 'g'))
      .closest('tr')
      .within(() => {
        cy.get('input[type=checkbox]').click();
      });
    cy.contains('Remove').click();
    cy.waitUntil(() => cy.contains('Network successfully removed'));
  } else {
  }
});

// Create a Volume (Docker)
Cypress.Commands.add('createVolume', (location, resourceName, ownership = '', users = [], teams = [], waitForRedirection = true) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/volumes/new`);
    cy.waitUntil(() => cy.get('#volume_name'))
      .click()
      .type(resourceName);
    cy.setOwnership(ownership, users, teams);
    cy.contains('Create the volume').click();
    // Wait for redirection to volumes view
    if (waitForRedirection) cy.waitUntil(() => cy.contains('Volume list', { timeout: 120000 }));
  }
});

// Delete a Volume (Docker)
Cypress.Commands.add('deleteVolume', (location, resourceName) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/volumes`);
    cy.waitUntil(() => cy.contains('Volume list', { timeout: 120000 })).showAllResources();
    cy.contains(new RegExp('^' + resourceName + '$', 'g'))
      .closest('tr')
      .within(() => {
        cy.get('input[type=checkbox]').click();
      });
    cy.contains('Remove').click();
    cy.waitUntil(() => cy.contains('Volume successfully removed'));
  } else {
  }
});

// Create a Config (Docker)
Cypress.Commands.add('createConfig', (location, resourceName, ownership = '', users = [], teams = [], waitForRedirection = true) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/configs/new`);
    cy.waitUntil(() => cy.get('#config_name'))
      .click()
      .type(resourceName);
    cy.waitUntil(() => cy.get('.CodeMirror-scroll'))
      .click()
      .type('This is a config');
    cy.setOwnership(ownership, users, teams);
    cy.get('button').contains('Create config').click();
    // Wait for redirection to configs view
    if (waitForRedirection) cy.waitUntil(() => cy.contains('Configs list', { timeout: 120000 }));
  }
});

// Delete a Config (Docker)
Cypress.Commands.add('deleteConfig', (location, resourceName) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/configs`);
    cy.waitUntil(() => cy.contains('Configs list', { timeout: 120000 })).showAllResources();
    cy.contains(new RegExp('^' + resourceName + '$', 'g'))
      .closest('tr')
      .within(() => {
        cy.get('input[type=checkbox]').click();
      });
    cy.setOwnership(ownership, users, teams);
    cy.contains('Remove').click();
    cy.waitUntil(() => cy.contains('Config successfully removed'));
  } else {
  }
});

// Create a Secret (Docker)
Cypress.Commands.add('createSecret', (location, resourceName, ownership = '', users = [], teams = [], waitForRedirection = true) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/secrets/new`);
    cy.waitUntil(() => cy.get('#secret_name'))
      .click()
      .type(resourceName);
    cy.waitUntil(() => cy.get('textarea'))
      .click()
      .type('This is a secret');
    cy.setOwnership(ownership, users, teams);
    cy.contains('Create the secret').click();
    // Wait for redirection to secrets view
    if (waitForRedirection) cy.waitUntil(() => cy.contains('Secrets list', { timeout: 120000 }));
  }
});

// Delete a Secret (Docker)
Cypress.Commands.add('deleteSecret', (location, resourceName) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/secrets`);
    cy.waitUntil(() => cy.contains('Secrets list', { timeout: 120000 })).showAllResources();
    cy.contains(new RegExp('^' + resourceName + '$', 'g'))
      .closest('tr')
      .within(() => {
        cy.get('input[type=checkbox]').click();
      });
    cy.contains('Remove').click();
    cy.waitUntil(() => cy.contains('Secret successfully removed'));
  } else {
  }
});
