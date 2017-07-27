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

const (
	bindusername = "admin"
	bindpassword = "roucoups666"
	baseDN       = "dc=ldap,dc=example,dc=com"
	ldapserver   = "localhost"
	ldapport     = 389
)

// Service represents a service used to authenticate users against a LDAP/AD.
type Service struct{}

// AuthenticateUser is used to authenticate a user against a LDAP/AD.
func (*Service) AuthenticateUser(username, password string) error {

	log.Println("Step 1")
	l, err := ldap.Dial("tcp", fmt.Sprintf("%s:%d", ldapserver, ldapport))
	if err != nil {
		return err
	}
	defer l.Close()

	log.Println("Step 2")
	dn := fmt.Sprintf("cn=%s,%s", bindusername, baseDN)
	err = l.Bind(dn, bindpassword)
	if err != nil {
		return err
	}

	log.Println("Step 3")
	searchRequest := ldap.NewSearchRequest(
		baseDN,
		ldap.ScopeWholeSubtree, ldap.NeverDerefAliases, 0, 0, false,
		fmt.Sprintf("(&(objectClass=account)(uid=%s))", username),
		// fmt.Sprintf("(&(objectClass=organizationalPerson)&(uid=%s))", username),
		[]string{"dn"},
		nil,
	)

	log.Println("Step 4")
	sr, err := l.Search(searchRequest)
	if err != nil {
		return err
	}

	log.Println("Step 5")
	if len(sr.Entries) != 1 {
		return ErrUserNotFound
	}

	userdn := sr.Entries[0].DN

	log.Println("Step 6")
	// Bind as the user to verify their password
	err = l.Bind(userdn, password)
	if err != nil {
		return err
		// log.Fatal(err)
	}

	log.Println("Step 7")
	return nil
}
