import 'cypress-wait-until';
import _ from 'lodash-es';
import { STATEOBJECT } from './vars.js';

Cypress.Commands.add('saveLocalStorage', () => {
  Object.keys(localStorage).forEach((key) => {
    STATEOBJECT.LOCAL_STORAGE_MEMORY[key] = localStorage[key];
  });
});

Cypress.Commands.add('restoreLocalStorage', () => {
  Object.keys(STATEOBJECT.LOCAL_STORAGE_MEMORY).forEach((key) => {
    localStorage.setItem(key, STATEOBJECT.LOCAL_STORAGE_MEMORY[key]);
  });
});

Cypress.Commands.add('saveUserToken', (username) => {
  STATEOBJECT.USER_TOKENS[username] = localStorage.getItem('portainer.JWT').slice(1, -1);
});

Cypress.Commands.add('deleteUserToken', (username) => {
  delete STATEOBJECT.USER_TOKENS[username];
});

Cypress.Commands.add('setBrowserToken', (username) => {
  localStorage.setItem('portainer.JWT', STATEOBJECT.USER_TOKENS[username]);
});

Cypress.Commands.add('clearBrowserToken', () => {
  localStorage.removeItem('portainer.JWT');
});

Cypress.Commands.add('clearUserTokens', () => {
  STATEOBJECT.USER_TOKENS = [];
});

Cypress.Commands.add('initAdmin', (username, password, analytics = true) => {
  cy.visit('/#/init/admin');
  // Wait text, meaning page has loaded
  cy.waitUntil(() => cy.contains('Please create the initial administrator user.'));

  if (username != 'admin') {
    cy.get('#username').clear().type(username);
  }
  cy.get('#password').type(password);
  cy.get('#confirm_password').type(password);

  // Opt out of analytics if required
  if (!analytics) cy.optOut();

  cy.get('[type=submit]').click();
});

Cypress.Commands.add('optOut', () => {
  cy.get('input[name="toggle_enableTelemetry"]').click();
});

Cypress.Commands.add('initEndpoint', (endpointType, platform) => {
  const endpointTypes = {
    'Docker Local': 1,
    'Kubernetes Local': 2,
    Agent: 5,
  };
  var endpointTypeId = endpointTypes[endpointType];
  cy.get(`[for=${endpointTypeId}]`).click();

  if (endpointTypeId == 5) {
    cy.get('#endpoint_name').type(`${platform} ${endpointType}`);

    var agentPort = platform.includes('Docker') ? '9001' : '30778';
    cy.get('#endpoint_url').type(`e2e-portainer:${agentPort}`);
  }

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

Cypress.Commands.add('addNewEndpointGroup', (endpointGroupName, endpoints) => {
  cy.route2({ method: 'GET', path: '**/endpoints*' }).as('addNewEndpointGroup:endpoints');
  cy.route2({ method: 'GET', path: '**/endpoint_groups' }).as('addNewEndpointGroup:endpoint_groups');
  cy.visit('/#!/groups/new');
  cy.wait('@addNewEndpointGroup:endpoints');

  cy.get('input[name="group_name"]').type(endpointGroupName);
  // Click all matching endpoints
  cy.get('group-association-table[table-type="available"]').within(() => {
    if (Array.isArray(endpoints)) {
      endpoints.forEach((endpoint) => {
        cy.get('td').contains(endpoint).click();
      });
    } else {
      cy.get('td').contains(endpoints).click();
    }
  });
  cy.get('button').contains('Create the group').click();
  cy.wait('@addNewEndpointGroup:endpoint_groups');
});

Cypress.Commands.add('selectEndpoint', (endpointName, platform) => {
  cy.visit('/#!/home');
  cy.waitUntil(() => cy.contains('span', endpointName)).click();
  cy.wait(500);
  cy.waitUntil(() => cy.get('rd-header-title[title-text="Dashboard"]', { timeout: 120000 }), { timeout: 120000 });

  // Get info from active endpoint for building URL's
  cy.request({
    method: 'GET',
    url: '/api/endpoints?limit=10&start=1',
    auth: {
      bearer: STATEOBJECT.USER_TOKENS['admin'],
    },
  })
    .its('body')
    .then((body) => {
      console.log('Body: ' + JSON.stringify(body));
      var endpointOBJ = _.find(body, { Name: endpointName });
      STATEOBJECT.ACTIVE_ENDPOINT_ID = endpointOBJ.Id;
      STATEOBJECT.ACTIVE_ENDPOINT_TYPE = endpointOBJ.Type;
    });

  if (platform == 'Docker Swarm') {
    // If endpoint is swarm, set swarmID
    cy.request({
      method: 'GET',
      url: `/api/endpoints/${STATEOBJECT.ACTIVE_ENDPOINT_ID}/docker/swarm`,
      auth: {
        bearer: STATEOBJECT.USER_TOKENS['admin'],
      },
      failOnStatusCode: false,
    })
      .its('body')
      .then((body) => {
        STATEOBJECT.ACTIVE_SWARM_ID = body.ID;
      });
  }
});

Cypress.Commands.add('auth', (location, username, password) => {
  cy.route2({ method: 'GET', path: '**/version' }).as('auth:version');
  if (location == 'frontend') {
    cy.visit('/#/auth');
    cy.get('#username').click();
    cy.get('#username').type(username);
    cy.get('#password').type(password);
    cy.waitUntil(() => cy.get('ng-transclude > .ng-scope:nth-child(1)')).click();
    // Wait until you hit the home screen then save token for later use
    // cy.waitUntil(() => cy.get('rd-header-title[title-text="Home"]', { timeout: 120000 })).saveUserToken(username);
    cy.wait('@auth:version').saveUserToken(username);
    cy.wait(1000);
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
        STATEOBJECT.USER_TOKENS[username] = body.jwt;
      });
  }
});

Cypress.Commands.add('logout', (username) => {
  // cy.route2('GET','**/check*').as('logout:admincheck');
  cy.server();
  cy.route('GET', '**/check').as('logout:admincheck');
  cy.log(`${username} user logged out`);
  cy.contains('a', 'log out').click();
  cy.wait(1200);
  cy.wait('@logout:admincheck');
});
Cypress.Commands.add('createUser', (location, username, password) => {
  cy.route2({ method: 'POST', path: '**/users' }).as('createUser:users');

  if (location == 'frontend') {
    cy.visit('/#!/users');
    cy.waitUntil(() => cy.get('#username')).click();
    cy.get('#username').type(username);
    cy.get('#password').type(password);
    cy.get('#confirm_password').type(password);
    cy.get('.btn-primary').click();
    cy.wait('@createUser:users');
  } else {
    cy.request({
      method: 'POST',
      url: '/api/users',
      auth: {
        bearer: STATEOBJECT.USER_TOKENS['admin'],
      },
      body: {
        username: username,
        password: password,
        role: 2,
      },
    }).then(() => {
      cy.log(`${username} user successfully created`);
    });
  }
});

Cypress.Commands.add('getUserId', (username) => {
  cy.request({
    method: 'GET',
    url: '/api/users',
    auth: {
      bearer: STATEOBJECT.USER_TOKENS['admin'],
    },
  }).then((response) => {
    let userOBJ = _.find(response.body, { Username: username });
    return userOBJ.Id;
  });
});

Cypress.Commands.add('getUsers', () => {
  cy.request({
    method: 'GET',
    url: '/api/users',
    auth: {
      bearer: STATEOBJECT.USER_TOKENS['admin'],
    },
  }).then((response) => {
    return response.body;
  });
});

Cypress.Commands.add('deleteUser', (username) => {
  cy.request({
    method: 'GET',
    url: '/api/users',
    auth: {
      bearer: STATEOBJECT.USER_TOKENS['admin'],
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
              bearer: STATEOBJECT.USER_TOKENS['admin'],
            },
          }).then(() => {
            cy.log(`${username} user successfully deleted`);
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
      bearer: STATEOBJECT.USER_TOKENS['admin'],
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
              bearer: STATEOBJECT.USER_TOKENS['admin'],
            },
          });
        }
      }
    });
});

Cypress.Commands.add('createTeam', (location, teamName) => {
  if (location == 'frontend') {
    cy.route2({ method: 'POST', path: '**/teams' }).as('createTeam:teams');
    cy.visit('/#!/teams');
    cy.get('#team_name').click().type(teamName);
    cy.get('.btn-primary').click();
    cy.wait('@createTeam:teams');
  } else {
    cy.request({
      method: 'POST',
      url: '/api/teams',
      auth: {
        bearer: STATEOBJECT.USER_TOKENS['admin'],
      },
      body: {
        Name: teamName,
      },
    }).then(() => {
      cy.log(`${teamName} team successfully created`);
    });
  }
});

Cypress.Commands.add('deleteTeam', (teamName) => {
  cy.request({
    method: 'GET',
    url: '/api/teams',
    auth: {
      bearer: STATEOBJECT.USER_TOKENS['admin'],
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
              bearer: STATEOBJECT.USER_TOKENS['admin'],
            },
          }).then(() => {
            cy.log(`${teamName} team successfully deleted`);
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
      bearer: STATEOBJECT.USER_TOKENS['admin'],
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
            bearer: STATEOBJECT.USER_TOKENS['admin'],
          },
        });
      }
    });
});

Cypress.Commands.add('getTeams', () => {
  cy.request({
    method: 'GET',
    url: '/api/teams',
    auth: {
      bearer: STATEOBJECT.USER_TOKENS['admin'],
    },
  }).then((response) => {
    return response.body;
  });
});

// Navigate to teams view and add a user to a team
Cypress.Commands.add('addToTeam', (username, teamName) => {
  cy.route2({ method: 'GET', path: '**/memberships' }).as('addToTeam:memberships');
  cy.route2({ method: 'POST', path: '**/team_memberships' }).as('addToTeam:team_memberships');
  cy.route2({ method: 'GET', path: '**/teams' }).as('addToTeam:teams');
  cy.visit('/#!/teams');
  cy.wait('@addToTeam:teams');

  // Click team to browse to related team details view
  cy.clickLink(teamName);
  // Wait until all team memberships are fetched
  cy.wait('@addToTeam:memberships');

  // Get users table and execute within
  cy.waitUntil(() => cy.contains('.widget', 'Users')).within(() => {
    cy.contains('td', ' ' + username + ' ')
      .children('span')
      .click();
  });
  // Wait until user added to team
  cy.waitUntil(() => cy.contains('User added to team'));
  cy.wait('@addToTeam:team_memberships');
});

// Navigate to teams view and remove a user to a team
Cypress.Commands.add('removeFromTeam', (username, teamName) => {
  cy.route2({ method: 'GET', path: '**/memberships' }).as('removeFromTeam:memberships');
  cy.route2({ method: 'GET', path: '**/teams' }).as('removeFromTeam:teams');
  cy.visit('/#!/teams');
  cy.wait('@removeFromTeam:teams');

  // TODO: using route instead of route2 due to bug with 204 response https://github.com/cypress-io/cypress/issues/8999
  cy.server();
  cy.route('DELETE', '**/team_memberships/**').as('removeFromTeam:removeUser');

  // Click team to browse to related team details view
  cy.clickLink(teamName);
  // Wait until all team memberships are fetched
  cy.wait('@removeFromTeam:memberships');

  // Get users table and execute within
  cy.get('div[class="page-content"]').within(() => {
    cy.waitUntil(() => cy.contains(username))
      .children('span')
      .click();
  });

  // Wait until user removed from team
  cy.waitUntil(() => cy.contains('User removed from team'));
  cy.wait('@removeFromTeam:removeUser');
});

// Navigate to the endpoints or endpoint groups view and give the user/team access
Cypress.Commands.add('assignAccess', (platform, environment, entityName, entityType, role) => {
  cy.route2({ method: 'GET', path: '**/endpoint_groups' }).as('assignAccess:endpoint_groups');
  cy.route2({ method: 'GET', path: '**/teams' }).as('assignAccess:teams');

  // Go to right view & wait for page to finish loading
  environment == 'Endpoint' ? cy.visit('/#!/endpoints') : cy.visit('/#!/groups');
  cy.wait('@assignAccess:endpoint_groups');

  cy.contains(platform)
    .closest('tr')
    .within(() => {
      cy.contains('Manage access').click();
    });

  // Click user/team dropdown
  cy.waitUntil(() => cy.get('por-access-management')).within(() => {
    cy.get('.multiSelect > .ng-binding').click();
  });

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
  // Wait until accesses updated
  cy.waitUntil(() => cy.contains('Access successfully updated'));
  cy.wait('@assignAccess:teams');
});

// Navigate to the endpoints or endpoint groups view and remove the user/team access
Cypress.Commands.add('removeAccess', (platform, environment, entityName) => {
  cy.route2({ method: 'GET', path: '**/teams' }).as('removeAccess:teams');
  environment == 'Endpoint' ? cy.visit('/#!/endpoints') : cy.visit('/#!/groups');

  cy.get('tbody').within(() => {
    cy.contains('tr', platform).within(() => {
      cy.clickLink('Manage access');
    });
  });

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
  cy.waitUntil(() => cy.contains('Access successfully updated'));
  cy.wait('@removeAccess:teams');
});

// Navigate to the roles view and get the effective role of the user
Cypress.Commands.add('getEffectiveRole', (userName) => {
  cy.route2({ method: 'GET', path: '**/team_memberships' }).as('getEffectiveRole:team_memberships');
  cy.visit('/#!/roles');
  cy.wait('@getEffectiveRole:team_memberships');

  cy.get('access-viewer').within(() => {
    cy.get('span[aria-label="Select box activate"]').click();
    cy.contains(userName).click();
  });

  let effectiveRole;
  cy.get('access-viewer-datatable').within(() => {
    cy.get('tr > td')
      .eq(1)
      .invoke('text')
      .then((textContent) => {
        effectiveRole = textContent;
      });
  });
  cy.waitUntil(() => effectiveRole);
  return effectiveRole;
});

// Return a more restricitve role than that which is provided
Cypress.Commands.add('getMoreRestrictiveRole', (role) => {
  if (role == 'Endpoint administrator') {
    return 'Helpdesk';
  } else if (role == 'Helpdesk') {
    return 'Standard user';
  } else if (role == 'Standard user') {
    return 'Read-only user';
  }
});

// Return a less restricitve role than that which is provided
Cypress.Commands.add('getLessRestrictiveRole', (role) => {
  if (role == 'Helpdesk') {
    return 'Endpoint administrator';
  } else if (role == 'Standard user') {
    return 'Helpdesk';
  } else if (role == 'Read-only user') {
    return 'Standard user';
  }
});

Cypress.Commands.add('setOwnership', (ownership, users, teams) => {
  switch (ownership) {
    case 'admin':
      cy.get('#access_administrators').click();
      break;
    case 'restricted':
      cy.get('#access_restricted', { force: true }).click({ force: true });
      if (!_.isEmpty(teams)) {
        cy.get('.multiSelect').eq(0).click();
        cy.get('.checkBoxContainer').within(() => {
          for (const team in teams) {
            cy.contains(teams[team]).click();
          }
          cy.contains('portainer.io').click();
        });
        cy.get('.sidebar-footer-content').click();
      }
      if (!_.isEmpty(users)) {
        cy.get('.multiSelect').eq(1).click();
        cy.get('.checkBoxContainer').within(() => {
          for (const user in users) {
            console.log(user);
            cy.contains(users[user]).click();
          }
        });
        cy.get('.sidebar-footer-content').click();
      }
      break;
    case 'public':
      cy.get('por-access-control-form').within(() => {
        cy.get('label[class="switch"]').click();
      });
      break;
    default:
      cy.log('Resource created with default access');
  }
});

// Set users and teams in the resource control of a resource (requires user and team ids)
Cypress.Commands.add('setResourceControl', (resourceId, restrictionType, users = [], teams = []) => {
  if (area == 'frontend') {
    if (restrictionType == 'public') {
    }
  } else {
    var userIds = [];
    var teamIds = [];
    cy.getUsers().then((userObjects) => {
      for (const user of users) {
        userIds.push(_.find(userObjects, { Username: user }).Id);
      }
    });

    cy.getTeams().then((teamObjects) => {
      for (const team of teams) {
        teamIds.push(_.find(teamObjects, { Name: team }).Id);
      }
    });

    cy.request({
      method: 'PUT',
      url: `/api/resource_controls/${resourceId}`,
      auth: {
        bearer: STATEOBJECT.USER_TOKENS['admin'],
      },
      body: { AdministratorsOnly: true, Public: false, Users: userIds, Teams: teamIds },
    });
  }
});

Cypress.Commands.add('clickLink', (label) => {
  cy.waitUntil(() => cy.contains('a', label)).click();
});

Cypress.Commands.add('showAllResources', () => {
  cy.waitUntil(() => cy.contains('.limitSelector', 'Items per page', { timeout: 10000 })).within(() => {
    cy.get('select').select('All');
  });
});

Cypress.Commands.add('visitHomepage', () => {
  cy.route2({ method: 'GET', path: '**/endpoint_groups' }).as('visitHomepage:endpoint_groups');
  cy.visit('/').wait('@visitHomepage:endpoint_groups');
});

// Return a list resource names that are present in the data-table
Cypress.Commands.add('getResourceNames', (resourceType) => {
  var child = '';
  resourceType == 'service' || resourceType == 'network' ? (child = 2) : (child = 1);
  var resourceNames = [];
  cy.get(`tr > td:nth-child(${child}):visible > a`).then((elements) => {
    for (const el of elements) {
      resourceNames.push(el.innerText.trim());
    }
    return resourceNames;
  });
});

Cypress.Commands.add('text', { prevSubject: true }, (subject, options) => {
  return subject.text();
});
