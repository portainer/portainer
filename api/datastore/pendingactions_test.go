package datastore

import (
	"fmt"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/pendingactions/actions"
)

func Test_ConvertCleanNAPWithOverridePoliciesPayload(t *testing.T) {
	t.Run("test ConvertCleanNAPWithOverridePoliciesPayload", func(t *testing.T) {

		_, store := MustNewTestStore(t, true, false)
		defer store.Close()

		testData := []struct {
			Name          string
			PendingAction portainer.PendingAction
			Expected      any
			Err           bool
		}{
			{
				Name: "test actiondata with EndpointGroupID 1",
				PendingAction: portainer.PendingAction{
					EndpointID: 1,
					Action:     "CleanNAPWithOverridePolicies",
					ActionData: portainer.EndpointGroupID(1),
				},
				Expected: portainer.EndpointGroupID(1),
			},
			{
				Name: "test actionData nil",
				PendingAction: portainer.PendingAction{
					EndpointID: 2,
					Action:     "CleanNAPWithOverridePolicies",
					ActionData: nil,
				},
				Expected: nil,
			},
			{
				Name: "test actionData empty and expected error",
				PendingAction: portainer.PendingAction{
					EndpointID: 2,
					Action:     "CleanNAPWithOverridePolicies",
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
						var endpointGroupID portainer.EndpointGroupID
						err := endpointPendingAction.UnmarshallActionData(&endpointGroupID)

						fmt.Printf("endpointGroupID: %v err=%v\n", endpointGroupID, err)

						if d.Err && err == nil {
							t.Error(err)
						}

						if d.Expected == nil && endpointGroupID != 0 {
							t.Errorf("expected nil, got %d", endpointGroupID)
						}

						if d.Expected != nil {
							expected := d.Expected.(portainer.EndpointGroupID)
							if d.Expected != nil && expected != endpointGroupID {
								t.Errorf("expected EndpointGroupID %d, got %d", expected, endpointGroupID)
							}
						}
					}
				})
			}

			store.PendingActions().Delete(d.PendingAction.ID)
		}
	})
}
