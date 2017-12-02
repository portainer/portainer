package ldap

import (
	"fmt"
	"strings"

	"github.com/portainer/portainer"
	"github.com/portainer/portainer/crypto"

	"gopkg.in/ldap.v2"
)

const (
	// ErrUserNotFound defines an error raised when the user is not found via LDAP search
	// or that too many entries (> 1) are returned.
	ErrUserNotFound = portainer.Error("User not found or too many entries returned")
)

// Service represents a service used to authenticate users against a LDAP/AD.
type Service struct{}

func searchUser(username string, conn *ldap.Conn, settings []portainer.LDAPSearchSettings) (string, error) {
	var userDN string
	found := false
	for _, searchSettings := range settings {
		searchRequest := ldap.NewSearchRequest(
			searchSettings.BaseDN,
			ldap.ScopeWholeSubtree, ldap.NeverDerefAliases, 0, 0, false,
			fmt.Sprintf("(&%s(%s=%s))", searchSettings.Filter, searchSettings.UserNameAttribute, username),
			[]string{"dn"},
			nil,
		)

		// Deliberately skip errors on the search request so that we can jump to other search settings
		// if any issue arise with the current one.
		sr, err := conn.Search(searchRequest)
		if err != nil {
			continue
		}

		if len(sr.Entries) == 1 {
			found = true
			userDN = sr.Entries[0].DN
			break
		}
	}

	if !found {
		return "", ErrUserNotFound
	}

	return userDN, nil
}

func createConnection(settings *portainer.LDAPSettings) (*ldap.Conn, error) {

	url := strings.Split(settings.URL, ":")

	// Add default port to url if :port is not set
	if len(url) == 1 {
		if settings.TLSConfig.TLS {
			settings.URL += ":636"
		} else {
			settings.URL += ":389"
		}
	}

	if settings.TLSConfig.TLS || settings.StartTLS {
		config, err := crypto.CreateTLSConfiguration(&settings.TLSConfig)
		if err != nil {
			return nil, err
		}
		config.ServerName = url[0]

		if settings.TLSConfig.TLS {
			return ldap.DialTLS("tcp", settings.URL, config)
		}

		conn, err := ldap.Dial("tcp", settings.URL)
		if err != nil {
			return nil, err
		}

		err = conn.StartTLS(config)
		if err != nil {
			return nil, err
		}

		return conn, nil
	}

	return ldap.Dial("tcp", settings.URL)
}

// AuthenticateUser is used to authenticate a user against a LDAP/AD.
func (*Service) AuthenticateUser(username, password string, settings *portainer.LDAPSettings) error {

	connection, err := createConnection(settings)
	if err != nil {
		return err
	}
	defer connection.Close()

	err = connection.Bind(settings.ReaderDN, settings.Password)
	if err != nil {
		return err
	}

	userDN, err := searchUser(username, connection, settings.SearchSettings)
	if err != nil {
		return err
	}

	err = connection.Bind(userDN, password)
	if err != nil {
		return err
	}

	return nil
}

// TestConnectivity is used to test a connection against the LDAP server using the credentials
// specified in the LDAPSettings.
func (*Service) TestConnectivity(settings *portainer.LDAPSettings) error {

	connection, err := createConnection(settings)
	if err != nil {
		return err
	}
	defer connection.Close()

	err = connection.Bind(settings.ReaderDN, settings.Password)
	if err != nil {
		return err
	}
	return nil
}
