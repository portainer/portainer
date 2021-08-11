package ldap

import (
	"fmt"
	"strings"

	"github.com/pkg/errors"

	ldap "github.com/go-ldap/ldap/v3"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
	httperrors "github.com/portainer/portainer/api/http/errors"
)

var (
	// errUserNotFound defines an error raised when the user is not found via LDAP search
	// or that too many entries (> 1) are returned.
	errUserNotFound = errors.New("User not found or too many entries returned")
)

// Service represents a service used to authenticate users against a LDAP/AD.
type Service struct{}

func searchUser(username string, conn *ldap.Conn, settings []portainer.LDAPSearchSettings) (string, error) {
	var userDN string
	found := false
	usernameEscaped := ldap.EscapeFilter(username)

	for _, searchSettings := range settings {
		searchRequest := ldap.NewSearchRequest(
			searchSettings.BaseDN,
			ldap.ScopeWholeSubtree, ldap.NeverDerefAliases, 0, 0, false,
			fmt.Sprintf("(&%s(%s=%s))", searchSettings.Filter, searchSettings.UserNameAttribute, usernameEscaped),
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
		return "", errUserNotFound
	}

	return userDN, nil
}

func createConnection(settings *portainer.LDAPSettings) (*ldap.Conn, error) {

	if settings.TLSConfig.TLS || settings.StartTLS {
		config, err := crypto.CreateTLSConfigurationFromDisk(settings.TLSConfig.TLSCACertPath, settings.TLSConfig.TLSCertPath, settings.TLSConfig.TLSKeyPath, settings.TLSConfig.TLSSkipVerify)
		if err != nil {
			return nil, err
		}
		config.ServerName = strings.Split(settings.URL, ":")[0]

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

	if !settings.AnonymousMode {
		err = connection.Bind(settings.ReaderDN, settings.Password)
		if err != nil {
			return err
		}
	}

	userDN, err := searchUser(username, connection, settings.SearchSettings)
	if err != nil {
		return err
	}

	err = connection.Bind(userDN, password)
	if err != nil {
		return httperrors.ErrUnauthorized
	}

	return nil
}

// GetUserGroups is used to retrieve user groups from LDAP/AD.
func (*Service) GetUserGroups(username string, settings *portainer.LDAPSettings, useAutoAdminSearchSettings bool) ([]string, error) {
	connection, err := createConnection(settings)
	if err != nil {
		return nil, err
	}
	defer connection.Close()

	if !settings.AnonymousMode {
		err = connection.Bind(settings.ReaderDN, settings.Password)
		if err != nil {
			return nil, err
		}
	}

	userDN, err := searchUser(username, connection, settings.SearchSettings)
	if err != nil {
		return nil, err
	}

	groupSearchSettings := settings.GroupSearchSettings
	if useAutoAdminSearchSettings {
		groupSearchSettings = settings.AdminGroupSearchSettings
	}

	userGroups := getGroupsByUser(userDN, connection, groupSearchSettings)

	return userGroups, nil
}

// SearchGroups searches for groups with the specified settings
func (*Service) SearchAdminGroups(settings *portainer.LDAPSettings) ([]string, error) {
	userGroups, err := searchUserGroups(settings, true)
	if err != nil {
		return nil, errors.WithMessage(err, "failed searching user groups")
	}

	deduplicatedGroups := make(map[string]struct{})
	for _, gs := range userGroups {
		for _, group := range gs {
			deduplicatedGroups[group] = struct{}{}
		}
	}
	groups := make([]string, 0, len(deduplicatedGroups))
	for group := range deduplicatedGroups {
		groups = append(groups, group)
	}

	return groups, nil
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

func searchUserGroups(settings *portainer.LDAPSettings, useAutoAdminSearchSettings bool) (map[string][]string, error) {
	connection, err := createConnection(settings)
	if err != nil {
		return nil, errors.WithMessage(err, "failed to esteblish an LDAP connection")
	}
	defer connection.Close()

	if !settings.AnonymousMode {
		if err := connection.Bind(settings.ReaderDN, settings.Password); err != nil {
			return nil, errors.Wrap(err, "failed to bind an LDAP connection")
		}
	}

	groupSearchSettings := settings.GroupSearchSettings
	if useAutoAdminSearchSettings {
		groupSearchSettings = settings.AdminGroupSearchSettings
	}

	userGroups := make(map[string][]string)

	for _, searchSettings := range groupSearchSettings {
		searchRequest := ldap.NewSearchRequest(
			searchSettings.GroupBaseDN,
			ldap.ScopeWholeSubtree, ldap.NeverDerefAliases, 0, 0, false,
			searchSettings.GroupFilter,
			[]string{"cn", searchSettings.GroupAttribute},
			nil,
		)

		sr, err := connection.Search(searchRequest)
		if err != nil {
			return nil, errors.Wrap(err, "failed to perform a user groups search")
		}

		for _, entry := range sr.Entries {
			members := entry.GetAttributeValues(searchSettings.GroupAttribute)
			for _, username := range members {
				userGroups[username] = append(userGroups[username], entry.GetAttributeValue("cn"))
			}
		}
	}

	return userGroups, nil
}

// Get a list of group names for specified user from LDAP/AD
func getGroupsByUser(userDN string, conn *ldap.Conn, settings []portainer.LDAPGroupSearchSettings) []string {
	groups := make([]string, 0)
	userDNEscaped := ldap.EscapeFilter(userDN)

	for _, searchSettings := range settings {
		searchRequest := ldap.NewSearchRequest(
			searchSettings.GroupBaseDN,
			ldap.ScopeWholeSubtree, ldap.NeverDerefAliases, 0, 0, false,
			fmt.Sprintf("(&%s(%s=%s))", searchSettings.GroupFilter, searchSettings.GroupAttribute, userDNEscaped),
			[]string{"cn"},
			nil,
		)

		// Deliberately skip errors on the search request so that we can jump to other search settings
		// if any issue arise with the current one.
		sr, err := conn.Search(searchRequest)
		if err != nil {
			continue
		}

		for _, entry := range sr.Entries {
			for _, attr := range entry.Attributes {
				groups = append(groups, attr.Values[0])
			}
		}
	}

	return groups
}
