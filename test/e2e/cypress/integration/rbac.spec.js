// RBAC testing with different authentication options
context('RBAC Tests', () => {
  // Test with Internal Authentication
  describe('Standard RBAC', function () {
    before(() => {
      cy.frontendAuth('admin', 'portaineriscool');
      cy.saveLocalStorage();
    });
    beforeEach(() => {
      cy.restoreLocalStorage();
    });

    it('User created, user assigned as endpoint-admin against an endpoint', function () {
      cy.wait(1000);
      cy.contains('local').click();
      cy.wait(1000);
      // Go to users view and create users
      cy.createUser('adam', 'portainer');
      cy.createUser('eve', 'portainer');
      cy.createUser('bob', 'portainer');
      cy.createUser('steve', 'portainer');
      cy.createTeam('admins');
      cy.createTeam('helpdesk');
      cy.createTeam('standard');
      cy.createTeam('readonly');
      cy.assignToTeam('adam', 'admins');
      cy.assignToTeam('eve', 'helpdesk');
      cy.assignToTeam('bob', 'standard');
      cy.assignToTeam('steve', 'readonly');
      cy.assignAccess('admins', 'team', 'Endpoint administrator');
      cy.assignAccess('helpdesk', 'team', 'Helpdesk');
      cy.assignAccess('standard', 'team', 'Standard user');
      cy.assignAccess('readonly', 'team', 'Read-only user');
    });

    it('User created, user logged in, user assigned as endpoint-admin against an endpoint', function () {});

    it('User created, user assigned as helpdesk against an endpoint', function () {});

    it('User created, user logged in, user assigned as helpdesk against an endpoint', function () {});

    it('User created, user assigned as standard user against an endpoint', function () {});

    it('User created, user logged in, user assigned as standard user against an endpoint', function () {});

    it('User created, user assigned as read-only against an endpoint', function () {});

    it('User created, user logged in, user assigned as read-only against an endpoint', function () {});
  });

  // Test with Oauth authentication
  describe('Init admin', function () {
    it('Create user and verify success', function () {});
  });

  // Test against LDAP
  describe('Init admin', function () {
    it('Create user and verify success', function () {});
  });
});
