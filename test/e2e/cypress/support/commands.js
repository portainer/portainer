import 'cypress-wait-until';
import _ from 'lodash-es';

let LOCAL_STORAGE_MEMORY = {};
let USER_TOKENS = [];
let ACTIVE_ENDPOINT_ID = '';
let ACTIVE_ENDPOINT_TYPE = '';

Cypress.Commands.add('saveLocalStorage', () => {
  Object.keys(localStorage).forEach((key) => {
    LOCAL_STORAGE_MEMORY[key] = localStorage[key];
  });
});

Cypress.Commands.add('restoreLocalStorage', () => {
  Object.keys(LOCAL_STORAGE_MEMORY).forEach((key) => {
    localStorage.setItem(key, LOCAL_STORAGE_MEMORY[key]);
  });
});

Cypress.Commands.add('saveUserToken', (username) => {
  USER_TOKENS[username] = localStorage.getItem('portainer.JWT').slice(1, -1);
});

Cypress.Commands.add('deleteUserToken', (username) => {
  delete USER_TOKENS[username];
});

Cypress.Commands.add('setBrowserToken', (username) => {
  localStorage.setItem('portainer.JWT', USER_TOKENS[username]);
});

Cypress.Commands.add('clearBrowserToken', () => {
  localStorage.removeItem('portainer.JWT');
});

Cypress.Commands.add('clearUserTokens', () => {
  USER_TOKENS = [];
});

Cypress.Commands.add('initAdmin', (username, password) => {
  cy.visit('/#/init/admin');
  // Wait text, meaning page has loaded
  cy.waitUntil(() => cy.contains('Please create the initial administrator user.'));

  if (username != 'admin') {
    cy.get('#username').clear().type(username);
  }
  cy.get('#password').type(password);
  cy.get('#confirm_password').type(password);
  cy.get('[type=submit]').click();
});

Cypress.Commands.add('initEndpoint', () => {
  cy.get('[for=1]').click();
  cy.get('[type=submit]').click();
});

Cypress.Commands.add('addNewEndpoint', (endpointName, endpointType, endpointURL) => {
  const addEndpoint = (endpointName, endpointType, endpointURL) => {
    cy.contains(endpointType).click();
    cy.get('input[name=container_name]').type(endpointName);
    cy.get('input[name=endpoint_url]').clear().type(endpointURL);
    cy.get('span').contains('Add endpoint').click();
    cy.waitUntil(() => cy.contains('Endpoints'));
  };

  cy.visit('/#!/endpoints/new');
  cy.waitUntil(() => cy.contains('Create endpoint'));
  addEndpoint(endpointName, endpointType, endpointURL);
});

Cypress.Commands.add('selectEndpoint', (endpointName) => {
  cy.visit('/#!/home');
  cy.waitUntil(() => cy.contains(endpointName).click());
  cy.waitUntil(() => cy.get('rd-header-title[title-text="Dashboard"]'));

  // Get info from active endpoint for building URL's
  cy.request({
    method: 'GET',
    url: '/api/endpoints?limit=10&start=1',
    auth: {
      bearer: USER_TOKENS['admin'],
    },
  })
    .its('body')
    .then((body) => {
      let endpointOBJ = _.find(body, { Name: endpointName });
      ACTIVE_ENDPOINT_ID = endpointOBJ.Id;
      ACTIVE_ENDPOINT_TYPE = endpointOBJ.Type;
    });
});

Cypress.Commands.add('auth', (location, username, password) => {
  if (location == 'frontend') {
    cy.visit('/#/auth');
    cy.get('#username').click();
    cy.get('#username').type(username);
    cy.get('#password').type(password);
    cy.waitUntil(() => cy.get('ng-transclude > .ng-scope:nth-child(1)')).click();
    // Wait until you hit the home screen and get at least 1 endpoint item
    cy.waitUntil(() => cy.get('endpoint-item')).saveUserToken(username);
  } else {
    cy.request({
      method: 'POST',
      url: '/api/auth',
      body: {
        username: username,
        password: password,
      },
    })
      .its('body')
      .then((body) => {
        USER_TOKENS[username] = body.jwt;
      });
  }
});

Cypress.Commands.add('createUser', (location, username, password) => {
  // Setup team route to wait for response
  cy.route2({ method: 'POST', path: '**/users' }).as('users');

  if (location == 'frontend') {
    cy.visit('/#!/users');
    cy.waitUntil(() => cy.get('#username')).click();
    cy.get('#username').type(username);
    cy.get('#password').type(password);
    cy.get('#confirm_password').type(password);
    cy.get('.btn-primary').click();
    cy.wait('@users');
  } else {
    cy.request({
      method: 'POST',
      url: '/api/users',
      failOnStatusCode: false,
      auth: {
        bearer: USER_TOKENS['admin'],
      },
      body: {
        username: username,
        password: password,
        role: 2,
      },
    });
  }
});

Cypress.Commands.add('deleteUser', (username) => {
  cy.request({
    method: 'GET',
    url: '/api/users',
    auth: {
      bearer: USER_TOKENS['admin'],
    },
  })
    .its('body')
    .then((response) => {
      let users = response;

      for (var key in users) {
        if (users[key].Username == username) {
          cy.request({
            method: 'DELETE',
            url: '/api/users/' + users[key].Id,
            auth: {
              bearer: USER_TOKENS['admin'],
            },
          });
        }
      }
    });
});

Cypress.Commands.add('deleteUsers', () => {
  cy.request({
    method: 'GET',
    url: '/api/users',
    auth: {
      bearer: USER_TOKENS['admin'],
    },
  })
    .its('body')
    .then((response) => {
      let users = response;

      for (var key in users) {
        if (users[key].Id != 1) {
          cy.request({
            method: 'DELETE',
            url: '/api/users/' + users[key].Id,
            auth: {
              bearer: USER_TOKENS['admin'],
            },
          });
        }
      }
    });
});

Cypress.Commands.add('createTeam', (location, teamName) => {
  if (location == 'frontend') {
    // Setup team route to wait for response
    cy.route2('POST', '**/teams').as('teams');

    cy.visit('/#!/teams');
    cy.get('#team_name').click().type(teamName);
    cy.get('.btn-primary').click();
    cy.wait('@teams');
  } else {
    cy.request({
      method: 'POST',
      url: '/api/teams',
      failOnStatusCode: false,
      auth: {
        bearer: USER_TOKENS['admin'],
      },
      body: {
        Name: teamName,
      },
    });
  }
});

Cypress.Commands.add('deleteTeam', (teamName) => {
  cy.request({
    method: 'GET',
    url: '/api/teams',
    auth: {
      bearer: USER_TOKENS['admin'],
    },
  })
    .its('body')
    .then((response) => {
      let teams = response;

      for (var key in teams) {
        if (teams[key].Name == teamName) {
          cy.request({
            method: 'DELETE',
            url: '/api/teams/' + teams[key].Id,
            auth: {
              bearer: USER_TOKENS['admin'],
            },
          });
        }
      }
    });
});

Cypress.Commands.add('deleteTeams', () => {
  cy.request({
    method: 'GET',
    url: '/api/teams',
    auth: {
      bearer: USER_TOKENS['admin'],
    },
  })
    .its('body')
    .then((response) => {
      let teams = response;

      for (var key in teams) {
        cy.request({
          method: 'DELETE',
          url: '/api/teams/' + teams[key].Id,
          auth: {
            bearer: USER_TOKENS['admin'],
          },
        });
      }
    });
});

// Navigate to teams view and assign a user to a team
Cypress.Commands.add('assignToTeam', (username, teamName) => {
  cy.visit('/#!/teams');

  // Click team to browse to related team details view
  cy.clickLink(teamName);

  // Get users table and execute within
  cy.waitUntil(() => cy.contains('.widget', 'Users')).within(() => {
    cy.contains('td', ' ' + username + ' ')
      .children('span')
      .click();
  });
});

// Navigate to the endpoints view and give the user/team access
Cypress.Commands.add('assignAccess', (endpointName, entityName, entityType, role) => {
  cy.visit('/#!/endpoints');
  cy.contains('tr', endpointName).within(() => {
    cy.clickLink('Manage access');
  });
  // Click user/team dropdown
  cy.waitUntil(() => cy.get('.multiSelect > .ng-binding')).click();

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
  // If a role is provided, click role dropdown and select role
  if (role) {
    cy.get('.form-control:nth-child(1)').select(role);
  }
  // Click Create access button
  cy.get('button[type=submit]').click();
});

Cypress.Commands.add('createStack', (location, resourceName, waitForRedirection = true) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${ACTIVE_ENDPOINT_ID}/docker/stacks/newstack`);
    cy.waitUntil(() => cy.get('#stack_name'))
      .click()
      .type(resourceName);
    if (ACTIVE_ENDPOINT_TYPE == '1') {
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
    cy.contains('Deploy the stack').click();
    // Wait for redirection to stacks view
    if (waitForRedirection) cy.waitUntil(() => cy.contains('Stacks list', { timeout: 60000 }));
  }
});

Cypress.Commands.add('deleteStack', (location, resourceName) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${ACTIVE_ENDPOINT_ID}/docker/stacks`);
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

Cypress.Commands.add('createService', (location, resourceName, waitForRedirection = true) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${ACTIVE_ENDPOINT_ID}/docker/services/new`);
    cy.waitUntil(() => cy.get('#service_name'))
      .click()
      .type(resourceName);
    cy.get('input[name=image_name]').type('nginx:alpine');
    cy.contains('Create the service').click();
    // Wait for redirection to services view
    if (waitForRedirection) cy.waitUntil(() => cy.contains('Service list', { timeout: 120000 }));
  }
});

Cypress.Commands.add('deleteService', (location, resourceName) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${ACTIVE_ENDPOINT_ID}/docker/services`);
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

Cypress.Commands.add('createContainer', (location, resourceName, waitForRedirection = true) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${ACTIVE_ENDPOINT_ID}/docker/containers/new`);
    cy.waitUntil(() => cy.get('#container_name'))
      .click()
      .type(resourceName);
    cy.get('input[name=image_name]').type('nginx:alpine');
    cy.contains('Deploy the container').click();
    // Wait for redirection to containers view
    if (waitForRedirection) cy.waitUntil(() => cy.contains('Container list', { timeout: 120000 }));
  }
});

Cypress.Commands.add('deleteContainer', (location, resourceName) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${ACTIVE_ENDPOINT_ID}/docker/containers`);
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

Cypress.Commands.add('createNetwork', (location, resourceName, waitForRedirection = true) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${ACTIVE_ENDPOINT_ID}/docker/networks/new`);
    cy.waitUntil(() => cy.get('#network_name'))
      .click()
      .type(resourceName);
    cy.contains('Create the network').click();
    // Wait for redirection to networks view
    if (waitForRedirection) cy.waitUntil(() => cy.contains('Network list', { timeout: 120000 }));
  }
});

Cypress.Commands.add('deleteNetwork', (location, resourceName) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${ACTIVE_ENDPOINT_ID}/docker/networks`);
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

Cypress.Commands.add('createVolume', (location, resourceName, waitForRedirection = true) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${ACTIVE_ENDPOINT_ID}/docker/volumes/new`);
    cy.waitUntil(() => cy.get('#volume_name'))
      .click()
      .type(resourceName);
    cy.contains('Create the volume').click();
    // Wait for redirection to volumes view
    if (waitForRedirection) cy.waitUntil(() => cy.contains('Volume list', { timeout: 120000 }));
  }
});

Cypress.Commands.add('deleteVolume', (location, resourceName) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${ACTIVE_ENDPOINT_ID}/docker/volumes`);
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

Cypress.Commands.add('createConfig', (location, resourceName, waitForRedirection = true) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${ACTIVE_ENDPOINT_ID}/docker/configs/new`);
    cy.waitUntil(() => cy.get('#config_name'))
      .click()
      .type(resourceName);
    cy.waitUntil(() => cy.get('.CodeMirror-scroll'))
      .click()
      .type('This is a config');
    cy.get('button').contains('Create config').click();
    // Wait for redirection to configs view
    if (waitForRedirection) cy.waitUntil(() => cy.contains('Configs list', { timeout: 120000 }));
  }
});

Cypress.Commands.add('deleteConfig', (location, resourceName) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${ACTIVE_ENDPOINT_ID}/docker/configs`);
    cy.waitUntil(() => cy.contains('Configs list', { timeout: 120000 })).showAllResources();
    cy.contains(new RegExp('^' + resourceName + '$', 'g'))
      .closest('tr')
      .within(() => {
        cy.get('input[type=checkbox]').click();
      });
    cy.contains('Remove').click();
    cy.waitUntil(() => cy.contains('Config successfully removed'));
  } else {
  }
});

Cypress.Commands.add('createSecret', (location, resourceName, waitForRedirection = true) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${ACTIVE_ENDPOINT_ID}/docker/secrets/new`);
    cy.waitUntil(() => cy.get('#secret_name'))
      .click()
      .type(resourceName);
    cy.waitUntil(() => cy.get('textarea'))
      .click()
      .type('This is a secret');
    cy.contains('Create the secret').click();
    // Wait for redirection to secrets view
    if (waitForRedirection) cy.waitUntil(() => cy.contains('Secrets list', { timeout: 120000 }));
  }
});

Cypress.Commands.add('deleteSecret', (location, resourceName) => {
  if (location == 'frontend') {
    cy.visit(`/#!/${ACTIVE_ENDPOINT_ID}/docker/secrets`);
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

Cypress.Commands.add('modifyResource', (location, action, resourceType, resourceName) => {
  // Dynamically call a custom cypress method on a resource of type 'resourceType'
  cy[action + resourceType](location, resourceName);
});

// Method for modifying all resources in an endpoint with the default names
Cypress.Commands.add('modifyResources', (location, action) => {
  const associatedResources = {
    1: ['Stack', 'Container', 'Network', 'Volume'],
    2: ['Stack', 'Service', 'Container', 'Network', 'Volume', 'Config', 'Secret'],
    3: ['Application'],
  };
  for (var res in associatedResources[ACTIVE_ENDPOINT_TYPE]) {
    let resource = associatedResources[ACTIVE_ENDPOINT_TYPE][res];
    cy.modifyResource(location, action, resource, resource.toLowerCase());
  }
});

Cypress.Commands.add('clickLink', (label) => {
  cy.waitUntil(() => cy.contains('a', label)).click();
});

Cypress.Commands.add('showAllResources', () => {
  cy.waitUntil(() => cy.contains('.limitSelector', 'Items per page')).within(() => {
    cy.get('select').select('All');
  });
});
