package authorization

import (
	portainer "github.com/portainer/portainer/api"
	"reflect"
	"testing"
)

func Test_getKeyRole(t *testing.T) {
	type args struct {
		roleIdentifiers []portainer.RoleID
		roles           []portainer.Role
	}

	roleAdmin := portainer.Role{
		Name:           "Endpoint administrator",
		Description:    "Full control of all resources in an endpoint",
		ID:             portainer.RoleIDEndpointAdmin,
		Priority:       1,
		Authorizations: DefaultEndpointAuthorizationsForEndpointAdministratorRole(),
	}

	roleOperator := portainer.Role{
		Name:           "Operator",
		Description:    "Operational control of all existing resources in an endpoint",
		ID:             portainer.RoleIDOperator,
		Priority:       2,
		Authorizations: DefaultEndpointAuthorizationsForOperatorRole(),
	}

	roleHelpdesk := portainer.Role{
		Name:           "Helpdesk",
		Description:    "Read-only access of all resources in an endpoint",
		ID:             portainer.RoleIDHelpdesk,
		Priority:       3,
		Authorizations: DefaultEndpointAuthorizationsForHelpDeskRole(),
	}

	roleStandard := portainer.Role{
		Name:           "Standard user",
		Description:    "Full control of assigned resources in an endpoint",
		ID:             portainer.RoleIDStandardUser,
		Priority:       4,
		Authorizations: DefaultEndpointAuthorizationsForStandardUserRole(),
	}

	roleReadonly := portainer.Role{
		Name:           "Read-only user",
		Description:    "Read-only access of assigned resources in an endpoint",
		ID:             portainer.RoleIDReadonly,
		Priority:       5,
		Authorizations: DefaultEndpointAuthorizationsForReadOnlyUserRole(),
	}

	roles := []portainer.Role{roleAdmin, roleOperator, roleHelpdesk, roleReadonly, roleStandard}

	tests := []struct {
		name string
		args args
		want *portainer.Role
	}{
		{
			name: "it should return Operator when Operator is before EndpointAdmin in the argument roleIdentifiers",
			args: args{
				roleIdentifiers: []portainer.RoleID{portainer.RoleIDOperator, portainer.RoleIDEndpointAdmin},
				roles:           roles,
			},
			want: &roleOperator,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := getKeyRole(tt.args.roleIdentifiers, tt.args.roles); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("getKeyRole() = %v, want %v", got, tt.want)
			}
		})
	}
}
