package oauth

import (
	"errors"
	"fmt"

	portainer "github.com/portainer/portainer/api"
)

func getUsername(datamap map[string]interface{}, configuration *portainer.OAuthSettings) (string, error) {
	username, ok := datamap[configuration.UserIdentifier].(string)
	if ok && username != "" {
		return username, nil
	}

	if !ok {
		username, ok := datamap[configuration.UserIdentifier].(float64)
		if ok && username != 0 {
			return fmt.Sprint(int(username)), nil
		}
	}

	return "", errors.New("failed to extract username from oauth resource")
}

func getNestedClaimValues(claimVal interface{}) ([]string, error) {
	switch val := claimVal.(type) {
	case nil:
		return []string{}, nil
	case string:
		return []string{val}, nil
	case int, float64:
		return []string{fmt.Sprintf("%v", val)}, nil
	case map[string]interface{}:
		valList := make([]string, 0)
		for _, v := range val {
			res, err := getNestedClaimValues(v)
			if err != nil {
				return nil, err
			}
			valList = append(valList, res...)
		}
		return valList, nil
	case []interface{}:
		valList := make([]string, 0)
		for _, v := range val {
			res, err := getNestedClaimValues(v)
			if err != nil {
				return nil, err
			}
			valList = append(valList, res...)
		}
		return valList, nil
	default:
		return nil, fmt.Errorf("failed to match type for map value: %v", val)
	}
}

func getTeams(datamap map[string]interface{}, configuration *portainer.OAuthSettings) ([]string, error) {
	if configuration.OAuthAutoMapTeamMemberships && configuration.TeamMemberships.OAuthClaimName != "" {
		teamClaimValues, ok := datamap[configuration.TeamMemberships.OAuthClaimName]
		if !ok {
			return nil, fmt.Errorf("unable to find team membership claim %s in oauth resource object", configuration.TeamMemberships.OAuthClaimName)
		}

		claimValues, err := getNestedClaimValues(teamClaimValues)
		if err != nil {
			return nil, fmt.Errorf("failed to extract nested claim values, map: %v, err: %w", teamClaimValues, err)
		}

		return claimValues, nil
	}
	return []string{}, nil
}
