package datastore

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/pendingactions/actions"
	"github.com/portainer/portainer/api/pendingactions/handlers"
)

type cleanNAPWithOverridePolicies struct {
	EndpointGroupID portainer.EndpointGroupID
}

func Test_ConvertCleanNAPWithOverridePoliciesPayload(t *testing.T) {
	t.Run("test ConvertCleanNAPWithOverridePoliciesPayload", func(t *testing.T) {

		_, store := MustNewTestStore(t, true, false)
		defer store.Close()

		gid := portainer.EndpointGroupID(1)

		testData := []struct {
			Name          string
			PendingAction portainer.PendingAction
			Expected      any
			Err           bool
		}{
			{
				Name: "test actiondata with EndpointGroupID 1",
				PendingAction: handlers.NewCleanNAPWithOverridePolicies(
					1,
					&gid,
				),
				Expected: portainer.EndpointGroupID(1),
			},
			{
				Name: "test actionData nil",
				PendingAction: handlers.NewCleanNAPWithOverridePolicies(
					2,
					nil,
				),
				Expected: nil,
			},
			{
				Name: "test actionData empty and expected error",
				PendingAction: portainer.PendingAction{
					EndpointID: 2,
					Action:     actions.CleanNAPWithOverridePolicies,
					ActionData: "",
				},
				Expected: nil,
				Err:      true,
			},
		}

		for _, d := range testData {
			err := store.PendingActions().Create(&d.PendingAction)
			if err != nil {
				t.Error(err)
				return
			}

			pendingActions, err := store.PendingActions().ReadAll()
			if err != nil {
				t.Error(err)
				return
			}

			for _, endpointPendingAction := range pendingActions {
				t.Run(d.Name, func(t *testing.T) {
					if endpointPendingAction.Action == actions.CleanNAPWithOverridePolicies {
						var payload cleanNAPWithOverridePolicies

						err := endpointPendingAction.UnmarshallActionData(&payload)

						if d.Err && err == nil {
							t.Error(err)
						}

						if d.Expected == nil && payload.EndpointGroupID != 0 {
							t.Errorf("expected nil, got %d", payload.EndpointGroupID)
						}

						if d.Expected != nil {
							expected := d.Expected.(portainer.EndpointGroupID)
							if d.Expected != nil && expected != payload.EndpointGroupID {
								t.Errorf("expected EndpointGroupID %d, got %d", expected, payload.EndpointGroupID)
							}
						}
					}
				})
			}

			store.PendingActions().Delete(d.PendingAction.ID)
		}
	})
}
