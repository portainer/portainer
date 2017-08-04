package ldap

import (
	"fmt"
	"log"

	"github.com/portainer/portainer"

	"gopkg.in/ldap.v2"
)

const (
	// ErrUserNotFound defines an error raised when the user is not found via LDAP search
	// or that too many entries (> 1) are returned.
	ErrUserNotFound = portainer.Error("User not found or too many entries returned")
)

// Service represents a service used to authenticate users against a LDAP/AD.
type Service struct{}

// TestConnectivity is used to test a connection against the LDAP server using the credentials
// specified in the LDAPSettings.
func (*Service) TestConnectivity(settings *portainer.LDAPSettings) error {

	l, err := ldap.Dial("tcp", settings.URL)
	if err != nil {
		return err
	}
	defer l.Close()

	err = l.Bind(settings.ReaderDN, settings.Password)
	if err != nil {
		return err
	}
	return nil
}

// AuthenticateUser is used to authenticate a user against a LDAP/AD.
func (*Service) AuthenticateUser(username, password string, settings *portainer.LDAPSettings) error {

	log.Println("Step 1")
	var connection *ldap.Conn
	// if settings.TLS {
	// 	config, err := crypto.CreateTLSConfiguration(endpoint.TLSCACertPath, endpoint.TLSCertPath, endpoint.TLSKeyPath)
	// 	if err != nil {
	// 		return err
	// 	}
	// 	connection, err := ldap.DialTLS("tcp", settings.URL, config)
	// } else {
	// 	connection, err := ldap.Dial("tcp", settings.URL)
	// }
	connection, err := ldap.Dial("tcp", settings.URL)
	if err != nil {
		return err
	}
	defer connection.Close()

	log.Println("Step 2")
	// dn := fmt.Sprintf("cn=%s,%s", settings.ReaderDN, settings.BaseDN)
	err = connection.Bind(settings.ReaderDN, settings.Password)
	if err != nil {
		return err
	}

	// searchSettings := settings.SearchSettings[0]
	// log.Println("Step 3")
	// searchRequest := ldap.NewSearchRequest(
	// 	searchSettings.BaseDN,
	// 	ldap.ScopeWholeSubtree, ldap.NeverDerefAliases, 0, 0, false,
	// 	fmt.Sprintf("(&%s(%s=%s))", searchSettings.Filter, searchSettings.UserNameAttribute, username),
	// 	// fmt.Sprintf("(&(objectClass=organizationalPerson)&(uid=%s))", username),
	// 	[]string{"dn"},
	// 	nil,
	// )
	//
	// log.Println("Step 4")
	// sr, err := l.Search(searchRequest)
	// if err != nil {
	// 	return err
	// }
	//
	// log.Println("Step 5")
	// if len(sr.Entries) != 1 {
	// 	return ErrUserNotFound
	// }
	// userdn := sr.Entries[0].DN

	userDN, err := searchUser(username, connection, settings.SearchSettings)
	if err != nil {
		return err
		// log.Fatal(err)
	}

	log.Println("Step 6")
	// Bind as the user to verify their password
	err = connection.Bind(userDN, password)
	if err != nil {
		return err
		// log.Fatal(err)
	}

	log.Println("Step 7")
	return nil
}

func searchUser(username string, conn *ldap.Conn, settings []portainer.LDAPSearchSettings) (string, error) {
	var userDN string
	found := false
	for _, searchSettings := range settings {
		log.Println("Step 3")
		searchRequest := ldap.NewSearchRequest(
			searchSettings.BaseDN,
			ldap.ScopeWholeSubtree, ldap.NeverDerefAliases, 0, 0, false,
			fmt.Sprintf("(&%s(%s=%s))", searchSettings.Filter, searchSettings.UserNameAttribute, username),
			// fmt.Sprintf("(&(objectClass=organizationalPerson)&(uid=%s))", username),
			[]string{"dn"},
			nil,
		)

		log.Println("Step 4")
		// Deliberately skip errors on the search request so that we can jump to other search settings
		// if any issue arise with the current one.
		sr, _ := conn.Search(searchRequest)
		// if err != nil {
		// 	return "", err
		// }

		log.Println("Step 5")
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
