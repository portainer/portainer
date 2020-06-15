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
      localStorage.setItem('portainer.JWT', body.jwt);
    });
});

Cypress.Commands.add('apiEnableExtension', (licenseKey) => {
  cy.request({
    method: 'POST',
    url: 'http://e2e-portainer:9000/api/extensions',
    auth: {
      bearer: localStorage.getItem('portainer.JWT').slice(1, -1),
    },
    body: {
      license: licenseKey,
    },
  });
  // .its('body')
  // .then(body => {
  //     cy.log(body.license);
  // })
  // localStorage.setItem("portainer.EXTENSION_STATE", [{"Id":3,"Enabled":true,"Version":"1.0.1","UpdateAvailable":false}])
});

Cypress.Commands.add('apiCreateUser', (username, password) => {
  cy.request({
    method: 'POST',
    url: 'http://e2e-portainer:9000/api/users',
    auth: {
      bearer: localStorage.getItem('portainer.JWT').slice(1, -1),
    },
    body: {
      username: username,
      password: password,
      role: 2,
    },
  });
});

Cypress.Commands.add('apiDeleteUser', (userID) => {
  cy.request({
    method: 'DELETE',
    url: 'http://e2e-portainer:9000/api/users/' + userID,
    auth: {
      bearer: localStorage.getItem('portainer.JWT').slice(1, -1),
    },
  });
});

Cypress.Commands.add('apiCreateTeam', (teamName) => {
  cy.request({
    method: 'POST',
    url: 'http://e2e-portainer:9000/api/teams',
    auth: {
      bearer: localStorage.getItem('portainer.JWT').slice(1, -1),
    },
    body: {
      Name: teamName,
    },
  });
});

Cypress.Commands.add('apiDeleteTeam', (teamID) => {
  cy.request({
    method: 'DELETE',
    url: 'http://e2e-portainer:9000/api/teams/' + teamID,
    auth: {
      bearer: localStorage.getItem('portainer.JWT').slice(1, -1),
    },
  });
});
