// AUTH COMMANDS

let LOCAL_STORAGE_MEMORY = {};
let USER_TOKENS = [];

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
  USER_TOKENS[username] = localStorage.getItem('portainer.JWT');
});

Cypress.Commands.add('deleteUserToken', (username) => {
  delete USER_TOKENS[username];
});

Cypress.Commands.add('setBrowserToken', (username) => {
  console.log(JSON.stringify(USER_TOKENS));
  localStorage.setItem('portainer.JWT', USER_TOKENS[username]);
});

Cypress.Commands.add('clearBrowserToken', () => {
  localStorage.removeItem('portainer.JWT');
});

Cypress.Commands.add('clearUserTokens', () => {
  USER_TOKENS = [];
});

Cypress.Commands.add('apiAuth', (username, password) => {
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
});

Cypress.Commands.add('apiCreateUser', (username, password) => {
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
});

Cypress.Commands.add('apiDeleteUser', (username) => {
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

Cypress.Commands.add('apiDeleteUsers', () => {
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

Cypress.Commands.add('apiCreateTeam', (teamName) => {
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
});

Cypress.Commands.add('apiDeleteTeam', (teamName) => {
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

Cypress.Commands.add('apiDeleteTeams', () => {
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
