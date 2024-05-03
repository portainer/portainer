package datastore

import (
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
			PendingAction portainer.PendingActions
			Expected      *actions.CleanNAPWithOverridePoliciesPayload
			Err           bool
		}{
			{
				Name: "test actiondata with EndpointGroupID 1",
				PendingAction: portainer.PendingActions{
					EndpointID: 1,
					Action:     "CleanNAPWithOverridePolicies",
					ActionData: &actions.CleanNAPWithOverridePoliciesPayload{
						EndpointGroupID: 1,
					},
				},
				Expected: &actions.CleanNAPWithOverridePoliciesPayload{
					EndpointGroupID: 1,
				},
			},
			{
				Name: "test actionData nil",
				PendingAction: portainer.PendingActions{
					EndpointID: 2,
					Action:     "CleanNAPWithOverridePolicies",
					ActionData: nil,
				},
				Expected: nil,
			},
			{
				Name: "test actionData empty and expected error",
				PendingAction: portainer.PendingActions{
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
					if endpointPendingAction.Action == "CleanNAPWithOverridePolicies" {
						actionData, err := actions.ConvertCleanNAPWithOverridePoliciesPayload(endpointPendingAction.ActionData)
						if d.Err && err == nil {
							t.Error(err)
						}

						if d.Expected == nil && actionData != nil {
							t.Errorf("expected nil , got %d", actionData)
						}

						if d.Expected != nil && actionData == nil {
							t.Errorf("expected not nil , got %d", actionData)
						}

						if d.Expected != nil && actionData.EndpointGroupID != d.Expected.EndpointGroupID {
							t.Errorf("expected EndpointGroupID %d , got %d", d.Expected.EndpointGroupID, actionData.EndpointGroupID)
						}
					}
				})
			}

			store.PendingActions().Delete(d.PendingAction.ID)
		}
	})
}
