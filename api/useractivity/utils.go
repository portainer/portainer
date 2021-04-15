package useractivity

import (
	"encoding/csv"
	"fmt"
	"io"
	"time"

	portainer "github.com/portainer/portainer/api"
)

// MarshalAuthLogsToCSV converts a list of logs to a CSV string
func MarshalAuthLogsToCSV(w io.Writer, logs []*portainer.AuthActivityLog) error {
	var headers = []string{
		"Time",
		"Origin",
		"Context",
		"Username",
		"Result",
	}

	csvw := csv.NewWriter(w)

	err := csvw.Write(headers)
	if err != nil {
		return err
	}

	for _, log := range logs {
		result := ""
		switch log.Type {
		case portainer.AuthenticationActivityFailure:
			result = "Authentication failure"
		case portainer.AuthenticationActivitySuccess:
			result = "Authentication success"
		case portainer.AuthenticationActivityLogOut:
			result = "Logout"
		}

		context := ""
		switch log.Context {
		case portainer.AuthenticationInternal:
			context = "Internal"
		case portainer.AuthenticationLDAP:
			context = "LDAP"
		case portainer.AuthenticationOAuth:
			context = "OAuth"
		}

		timestamp := time.Unix(log.Timestamp, 0)
		formattedTimestamp := fmt.Sprintf("%d-%02d-%02d %02d:%02d:%02d",
			timestamp.Year(), timestamp.Month(), timestamp.Day(),
			timestamp.Hour(), timestamp.Minute(), timestamp.Second())

		err := csvw.Write([]string{
			formattedTimestamp,
			log.Origin,
			context,
			log.Username,
			result,
		})
		if err != nil {
			return err
		}

	}
	csvw.Flush()

	return csvw.Error()
}

// MarshalLogsToCSV converts a list of logs to a CSV string
func MarshalLogsToCSV(w io.Writer, logs []*portainer.UserActivityLog) error {
	var headers = []string{
		"Time",
		"Username",
		"Endpoint",
		"Action",
		"Payload",
	}

	csvw := csv.NewWriter(w)

	err := csvw.Write(headers)
	if err != nil {
		return err
	}

	for _, log := range logs {

		timestamp := time.Unix(log.Timestamp, 0)
		formattedTimestamp := fmt.Sprintf("%d-%02d-%02d %02d:%02d:%02d",
			timestamp.Year(), timestamp.Month(), timestamp.Day(),
			timestamp.Hour(), timestamp.Minute(), timestamp.Second())

		err := csvw.Write([]string{
			formattedTimestamp,
			log.Username,
			log.Context,
			log.Action,
			string(log.Payload),
		})
		if err != nil {
			return err
		}
	}

	csvw.Flush()

	return csvw.Error()
}
