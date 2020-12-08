var moreRestrictiveRole = '';
var lessRestrictiveRole = '';

//             rbacTests('Kubernetes', 'Agent',    'Endpoint', 'Internal', 'Endpoint administrator', 'nonBasic')
export function rbacTests(platform, connectionType, resource, authType, role, testType = 'Basic') {
  var endpointName = connectionType == 'Local' ? 'local' : platform; // Kubernetes

  context(`${testType} testing of ${role} role on ${endpointName} ${connectionType} with access set on related ${resource} resource & ${authType} configured`, () => {
    before(() => {
      cy.log(`Configuring Portainer for ${authType}`);
    });
    ['Logged in before', 'Never logged in'].forEach((userLoginState) => {
      describe(`GIVEN the required user and teams are created by the admin AND the user's state is ${userLoginState}`, () => {
        beforeEach(() => {
          cy.visit('/');
          cy.auth('frontend', 'admin', 'portainer');
          cy.createUser('api', 'rbac-user', 'portainer');
          cy.createTeam('api', 'rbac-team-one');
          cy.createTeam('api', 'rbac-team-two');
          if (userLoginState == 'Logged in before') {
            cy.logout('admin');
            cy.auth('frontend', 'rbac-user', 'portainer');
            cy.logout('rbac-user');
            cy.auth('frontend', 'admin', 'portainer');
          }
          cy.visitHomepage('/');
        });
        afterEach(() => {
          cy.deleteUser('rbac-user');
          cy.deleteTeam('rbac-team-one');
          cy.deleteTeam('rbac-team-two');
          cy.clearBrowserToken();
        });

        //    1
        // U-----R
        it(`WHEN user assigned as ${role} role against ${resource} then role is given to user`, () => {
          cy.assignAccess(endpointName, resource, 'rbac-user', 'user', role);
          validateRbacUserAbilities(platform, endpointName, role, testType);
        });

        //    1      2
        // U-----T1-----R
        it(`WHEN user is added to a team and team assigned as ${role} role against ${resource} then role is given to user`, () => {
          cy.addToTeam('rbac-user', 'rbac-team-one');
          cy.assignAccess(endpointName, resource, 'rbac-team-one', 'team', role);
          validateRbacUserAbilities(platform, endpointName, role, testType);
        });

        //    2      1
        // U-----T1-----R
        it(`WHEN team assigned role ${role} against ${resource} and user added to team then role is given to user`, () => {
          cy.assignAccess(endpointName, resource, 'rbac-team-one', 'team', role);
          cy.addToTeam('rbac-user', 'rbac-team-one');
          validateRbacUserAbilities(platform, endpointName, role, testType);
        });

        if (role != 'Read-only user') {
          describe(`AND a team (that a user is a member of) is assigned as ${role} role against ${resource}`, () => {
            before(() => {
              cy.getMoreRestrictiveRole(role).then((returnedRole) => {
                moreRestrictiveRole = returnedRole;
              });
            });
            beforeEach(() => {
              //    1      2
              // U-----T1-----R
              cy.addToTeam('rbac-user', 'rbac-team-one');
              cy.assignAccess(endpointName, resource, 'rbac-team-one', 'team', role);
            });

            it(`WHEN the user is assigned a more restrictive role, THEN this role takes precedence and the user has the expected abilities of this role`, () => {
              //    1      2
              // U-----T1-----MRR
              cy.assignAccess(endpointName, resource, 'rbac-user', 'user', moreRestrictiveRole);
              validateRbacUserAbilities(endpointName, endpointName, moreRestrictiveRole, testType);
            });

            it(`WHEN a second team (that a user is a member of) is assigned a more restrictive role, THEN this role takes precedence and the user has the expected abilities of this role`, () => {
              //    1      2
              // U-----T2-----MRR
              cy.addToTeam('rbac-user', 'rbac-team-two');
              cy.assignAccess(endpointName, resource, 'rbac-team-two', 'team', moreRestrictiveRole);
              validateRbacUserAbilities(endpointName, endpointName, moreRestrictiveRole, testType);
            });

            describe('AND the user has been assigned a more restrictive role', () => {
              beforeEach(() => {
                //    1
                // U-----MRR
                cy.assignAccess(endpointName, resource, 'rbac-user', 'user', moreRestrictiveRole);
              });

              it(`WHEN the user role assignment is removed, THEN the user's effective role reverts back to the one inherited from the team and the user has the expected abilities of this role`, () => {
                //    1
                // U-----(Remove Role)
                cy.removeAccess(endpointName, resource, 'rbac-user');
                validateRbacUserAbilities(platform, endpointName, role, testType);
              });
            });

            describe('AND a second team (that a user is a member of) is assigned a more restrictive role', () => {
              beforeEach(() => {
                cy.addToTeam('rbac-user', 'rbac-team-two');
                cy.assignAccess(endpointName, resource, 'rbac-team-two', 'team', moreRestrictiveRole);
              });
              it(`WHEN the role assignment of the second team is removed, THEN the user's effective role reverts back to the one inherited from the first team and the user has the expected abilities of this role`, () => {
                cy.removeAccess(endpointName, resource, 'rbac-team-two');
                validateRbacUserAbilities(platform, endpointName, role, testType);
              });
              it(`WHEN the user is removed from the second team, THEN the user's effective role reverts back to the one inherited from the first team and the user has the expected abilities of this role`, () => {
                cy.removeFromTeam('rbac-user', 'rbac-team-two');
                validateRbacUserAbilities(platform, endpointName, role, testType);
              });
              it(`WHEN the second team is deleted, THEN the user's effective role reverts back to the one inherited from the first team and the user has the expected abilities of this role`, () => {
                cy.deleteTeam('rbac-team-two');
                validateRbacUserAbilities(platform, endpointName, role, testType);
              });
            });
          });
        }

        if (resource == 'Endpoint Group') {
          describe(`AND a user is assigned role ${role} on an endpoint group`, () => {
            before(() => {
              cy.getMoreRestrictiveRole(role).then((returnedRole) => {
                moreRestrictiveRole = returnedRole;
              });
              cy.getLessRestrictiveRole(role).then((returnedRole) => {
                lessRestrictiveRole = returnedRole;
              });
            });
            beforeEach(() => {
              cy.assignAccess(endpointName, resource, 'rbac-user', 'user', role);
            });
            it(`WHEN the user is assigned the same role on an endpoint which is a member of the endpoint group, THEN the user retains the expected abilities of this role`, () => {
              cy.assignAccess(endpointName, 'Endpoint', 'rbac-user', 'user', role);
              validateRbacUserAbilities(platform, endpointName, role, testType);
            });

            describe(`AND the user is assigned the same role on an endpoint which is a member of the endpoint group`, () => {
              beforeEach(() => {
                cy.assignAccess(endpointName, 'Endpoint', 'rbac-user', 'user', role);
              });
              it(`WHEN the same role assignment on the endpoint is removed, THEN the user's effective role stays the same and the user retains the expected abilities of this role`, () => {
                cy.removeAccess(endpointName, 'Endpoint', 'rbac-user');
                validateRbacUserAbilities(platform, endpointName, role, testType);
              });
            });

            if (role != 'Read-only user') {
              it(`WHEN the user is assigned a more restrictive role on an endpoint which is a member of the endpoint group, THEN this role takes precedence and the user has the expected abilities of this role`, () => {
                cy.assignAccess(endpointName, 'Endpoint', 'rbac-user', 'user', moreRestrictiveRole);
                validateRbacUserAbilities(endpointName, endpointName, moreRestrictiveRole, testType);
              });

              describe(`AND the user is assigned a more restrictive role on an endpoint which is a member of the endpoint group`, () => {
                beforeEach(() => {
                  cy.assignAccess(endpointName, 'Endpoint', 'rbac-user', 'user', moreRestrictiveRole);
                });
                it(`WHEN the more restrictive role assignment on the endpoint is removed, THEN the user's effective role reverts back to the one inherited from the endpoint group and the user has the expected abilities of this role`, () => {
                  cy.removeAccess(endpointName, 'Endpoint', 'rbac-user');
                  validateRbacUserAbilities(platform, endpointName, role, testType);
                });
              });
            }

            if (role != 'Endpoint administrator') {
              it(`WHEN the user is assigned a less restrictive role on an endpoint which is a member of the endpoint group, THEN this role takes precedence and the user has the expected abilities of this role`, () => {
                cy.assignAccess(endpointName, 'Endpoint', 'rbac-user', 'user', lessRestrictiveRole);
                validateRbacUserAbilities(endpointName, endpointName, lessRestrictiveRole, testType);
              });

              describe(`AND the user is assigned a less restrictive role on an endpoint which is a member of the endpoint group`, () => {
                beforeEach(() => {
                  cy.assignAccess(endpointName, 'Endpoint', 'rbac-user', 'user', lessRestrictiveRole);
                });
                it(`WHEN the less restrictive role assignment on the endpoint is removed, THEN the user's effective role reverts back to the one inherited from the endpoint group and the user has the expected abilities of this role`, () => {
                  cy.removeAccess(endpointName, 'Endpoint', 'rbac-user');
                  validateRbacUserAbilities(platform, endpointName, role, testType);
                });
              });
            }
          });
        }
      });
    });
  });
}

function validateRbacUserAbilities(platform, endpointName, role, testType) {
  // FixMe: stacks, endpionts, or other request here
  cy.route2({ method: 'GET', path: '**/endpoints*' }).as('validateRbacUserAbilities:stacks');

  cy.log(`Comparing the effective role of user in the access viewer to one that should be set ${role}`);
  cy.getEffectiveRole('rbac-user').then((effectiveRole) => {
    expect(effectiveRole).to.equal(role);
  });

  if (testType != 'Basic') {
    cy.log('Login as rbac-user & assert they can see the assigned endpoint');
    cy.clearBrowserToken();
    cy.auth('frontend', 'rbac-user', 'portainer');
    cy.get('endpoint-item').should('include.text', endpointName);

    cy.log('Click endpoint & assert they are redirected to dashboard view');
    cy.selectEndpoint(endpointName);
    cy.wait('@validateRbacUserAbilities:stacks');
    cy.url().should('include', 'dashboard');

    cy.log(`Asserting that rbac-user has access to all associated functionality expected for the RBAC role ${role}`);
    switch (platform) {
      case 'Docker Swarm':
        cy.validateDockerSwarmAbilities(endpointName, role);
        break;
      case 'Docker Standalone':
        cy.validateDockerStandaloneAbilities(endpointName, role);
        break;
      case 'Kubernetes':
        cy.validateKubernetesAbilities(endpointName, role);
        break;
    }
  }
}
