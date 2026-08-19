package oauth

import (
	"errors"
	"strconv"
)

func GetUsername(datamap map[string]any, userIdentifier string) (string, error) {
	username, ok := datamap[userIdentifier].(string)
	if ok && username != "" {
		return username, nil
	}

	if !ok {
		username, ok := datamap[userIdentifier].(float64)
		if ok && username != 0 {
			return strconv.Itoa(int(username)), nil
		}
	}

	return "", errors.New("failed to extract username from oauth resource")
}
