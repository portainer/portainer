package ldap

import (
	"fmt"
	"log"

	"gopkg.in/ldap.v2"
)

const (
	bindusername = "admin"
	bindpassword = "roucoups666"
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
	err = l.Bind(bindusername, bindpassword)
	if err != nil {
		return err
	}

	log.Println("Step 3")
	searchRequest := ldap.NewSearchRequest(
		"dc=example,dc=com",
		ldap.ScopeWholeSubtree, ldap.NeverDerefAliases, 0, 0, false,
		fmt.Sprintf("(&(objectClass=People)&(uid=%s))", username),
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
		// log.Fatal("User does not exist or too many entries returned")
		return err
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
