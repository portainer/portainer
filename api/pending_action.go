package portainer

import "github.com/segmentio/encoding/json"

type (
	PendingActionID int
	PendingAction   struct {
		ID         PendingActionID `json:"ID"`
		EndpointID EndpointID      `json:"EndpointID"`
		Action     string          `json:"Action"`
		ActionData any             `json:"ActionData"`
		CreatedAt  int64           `json:"CreatedAt"`
	}

	PendingActionHandler interface {
		Execute(PendingAction, *Endpoint) error
	}
)

// MarshalJSON marshals the PendingAction struct to JSON
// and converts the ActionData field to an embedded json string
// This makes unmarshalling the ActionData field easier
func (pa PendingAction) MarshalJSON() ([]byte, error) {
	// Create a map to hold the marshalled fields
	data := map[string]any{
		"ID":         pa.ID,
		"EndpointID": pa.EndpointID,
		"Action":     pa.Action,
		"CreatedAt":  pa.CreatedAt,
	}

	actionDataBytes, err := json.Marshal(pa.ActionData)
	if err != nil {
		return nil, err
	}
	data["ActionData"] = string(actionDataBytes)

	// Marshal the map
	return json.Marshal(data)
}

// Unmarshal the ActionData field from a string to a specific type.
func (pa PendingAction) UnmarshallActionData(v any) error {
	s, ok := pa.ActionData.(string)
	if !ok {
		return nil
	}

	return json.Unmarshal([]byte(s), v)
}
