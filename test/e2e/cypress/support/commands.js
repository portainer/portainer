let LOCAL_STORAGE_MEMORY = {};

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

Cypress.Commands.add('initAdmin', (username, password) => {
  cy.visit('/#/init/admin');
  if (username != 'admin') {
    cy.get('#username').clear().type(username);
  }
  cy.get('#password').type(password);
  cy.get('#confirm_password').type(password);
  cy.get('[type=submit]').click();
});

Cypress.Commands.add('initEndpoint', () => {
  cy.get('[for=local_endpoint]').click();
  cy.get('[type=submit]').click();
});

Cypress.Commands.add('apiAuth', (username, password) => {
  cy.request({
    method: 'POST',
    url: 'http://e2e-portainer:9000/api/auth',
    body: {
      username: username,
      password: password,
    },
  })
    .its('body')
    .then((body) => {
      cy.setLocalStorage('portainer.JWT', body.jwt);
    });
});

Cypress.Commands.add('frontendAuth', (username, password) => {
  cy.visit('/#/auth');

  cy.get('#username').click();
  cy.get('#username').type(username);
  cy.get('#password').type(password);
  cy.get('ng-transclude > .ng-scope:nth-child(1)').click();
});

Cypress.Commands.add('createUser', (username, password) => {
  cy.visit('/#/users');

  cy.wait(500);
  cy.get('#username').click();
  cy.get('#username').type(username);
  cy.get('#password').type(password);
  cy.get('#confirm_password').type(password);
  cy.get('.btn-primary').click();
  cy.wait(1000);
});

Cypress.Commands.add('createTeam', (teamName) => {
  cy.visit('/#/teams');

  cy.wait(500);
  cy.get('#team_name').click();
  cy.get('#team_name').type(teamName);
  cy.get('.btn-primary').click();
  cy.wait(1000);
});

// Navigate to teams view and assign a user to a team
Cypress.Commands.add('assignToTeam', (username, teamName) => {
  cy.visit('/#/teams');
  cy.wait(500);

  // Click team to browse to related team details view
  cy.clickLink(teamName);
  cy.wait(500);

  // Get users table and execute within
  cy.contains('.widget', 'Users').within(() => {
    cy.contains('td', ' ' + username + ' ')
      .children('span')
      .click();
  });
});

// Navigate to the endpoints view and give the user/team access
Cypress.Commands.add('assignAccess', (entityName, entityType, role) => {
  cy.visit('/#/endpoints');
  cy.wait(1000);

  // Click Manage Access in endpoint row
  cy.clickLink('Manage access');

  // Click user/team dropdown
  cy.get('.multiSelect > .ng-binding').click();

  // Make sure to select right type of entity
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
  // Click role dropdown and select role
  cy.get('.form-control:nth-child(1)').select(role);
  // Click Create access button
  cy.get('button[type=submit]').click();
});

Cypress.Commands.add('clickLink', (label) => {
  cy.get('a').contains(label).click();
});
