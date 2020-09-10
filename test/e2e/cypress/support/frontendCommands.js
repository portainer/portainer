Cypress.Commands.add('initAdmin', (username, password) => {
  cy.visit('/#/init/admin');
  cy.wait(1000);
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

Cypress.Commands.add('selectEndpoint', (Endpoint) => {
  cy.contains(Endpoint).click();
});

Cypress.Commands.add('frontendAuth', (username, password) => {
  cy.route('POST', '**/auth').as('postAuth');

  cy.visit('/#/auth');
  cy.get('#username').click();
  cy.get('#username').type(username);
  cy.get('#password').type(password);
  cy.get('ng-transclude > .ng-scope:nth-child(1)').click();
  cy.wait('@postAuth');
  cy.wait(500);
});

Cypress.Commands.add('frontendCreateUser', (username, password) => {
  // Setup user route to wait for response
  cy.route('POST', '**/users').as('users');

  cy.get('#username').click();
  cy.get('#username').type(username);
  cy.get('#password').type(password);
  cy.get('#confirm_password').type(password);
  cy.get('.btn-primary').click();
  cy.wait('@users');
});

Cypress.Commands.add('frontendCreateTeam', (teamName) => {
  // Setup team route to wait for response
  cy.route('POST', '**/teams').as('teams');

  cy.visit('/#/teams');
  cy.get('#team_name').click();
  cy.get('#team_name').type(teamName);
  cy.get('.btn-primary').click();
  cy.wait('@teams');
});

// Navigate to teams view and assign a user to a team
Cypress.Commands.add('assignToTeam', (username, teamName) => {
  cy.visit('/#/teams');

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
  cy.visit('/#!/endpoints');
  cy.wait(1000);

  // Click Manage Access in endpoint row
  cy.clickLink('Manage access');
  cy.wait(1000);
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

  // If a role is provided, click role dropdown and select role
  if (role) {
    cy.get('.form-control:nth-child(1)').select(role);
  }

  // Click Create access button
  cy.get('button[type=submit]').click();
  cy.wait(500);
});

Cypress.Commands.add('createStack', () => {
  cy.route('POST', '**/stacks').as('postStack');

  cy.visit('/#/stacks/newstack');
  cy.get('#stack_name').type('stack');
  cy.get('.CodeMirror-scroll').click({ force: true }).type("version: '3'").type('{enter}').type('services:').type('{enter}').type('  test:').type('{enter}').type('  image: nginx');
  cy.contains('Deploy the stack').click();
  cy.wait(5000);
  cy.wait('@postStack');
});

Cypress.Commands.add('createService', () => {
  // Create Service
  cy.visit('/#/services/new');
  cy.contains('#service_name').type('service');
  cy.get('por-image-registry > input').type('nginx:alpine');
  cy.contains('Create the service').click();
});

Cypress.Commands.add('createContainer', () => {
  // Create Container
});

Cypress.Commands.add('createNetwork', () => {
  // Create Network
});

Cypress.Commands.add('createSecret', () => {
  // Create Secret
});

Cypress.Commands.add('createConfig  ', () => {
  // Create Config
});

Cypress.Commands.add('createResources', () => {
  // Create Stack
  cy.createStack();
  cy.createService();
  // Create Service
  // Create Containers
  // Create Networks
  // Create Secrets
  // Create Config
});

Cypress.Commands.add('clickLink', (label) => {
  // Timeout included to wait for element to be rendered
  cy.contains('a', label, { timeout: 60000 }).click();
});
