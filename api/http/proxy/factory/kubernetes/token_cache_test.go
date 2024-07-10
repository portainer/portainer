package kubernetes

import (
	"errors"
	"testing"

	portainer "github.com/portainer/portainer/api"
)

func noTokFunc() (string, error) {
	return "", errors.New("no token found")
}

func stringTok(tok string) func() (string, error) {
	return func() (string, error) {
		return tok, nil
	}
}

func failFunc(t *testing.T) func() (string, error) {
	return func() (string, error) {
		t.FailNow()
		return noTokFunc()
	}
}

func TestTokenCacheDataRace(t *testing.T) {
	ch := make(chan struct{})

	for range 1000 {
		var tokenCache1, tokenCache2 *tokenCache

		mgr := NewTokenCacheManager()

		go func() {
			tokenCache1 = mgr.GetOrCreateTokenCache(1)
			ch <- struct{}{}
		}()

		go func() {
			tokenCache2 = mgr.GetOrCreateTokenCache(1)
			ch <- struct{}{}
		}()

		<-ch
		<-ch

		if tokenCache1 != tokenCache2 {
			t.FailNow()
		}
	}
}

func TestTokenCache(t *testing.T) {
	mgr := NewTokenCacheManager()
	tc1 := mgr.GetOrCreateTokenCache(1)
	tc2 := mgr.GetOrCreateTokenCache(2)
	tc3 := mgr.GetOrCreateTokenCache(3)

	uid := portainer.UserID(2)
	tokenString1 := "token-string-1"
	tokenString2 := "token-string-2"

	tok, err := tc1.getOrAddToken(uid, stringTok(tokenString1))
	if err != nil || tok != tokenString1 {
		t.FailNow()
	}

	tok, err = tc1.getOrAddToken(uid, failFunc(t))
	if err != nil || tok != tokenString1 {
		t.FailNow()
	}

	tok, err = tc2.getOrAddToken(uid, stringTok(tokenString2))
	if err != nil || tok != tokenString2 {
		t.FailNow()
	}

	_, err = tc3.getOrAddToken(uid, noTokFunc)
	if err == nil {
		t.FailNow()
	}

	// Remove one user from all the caches

	mgr.RemoveUserFromCache(uid)

	_, err = tc1.getOrAddToken(uid, noTokFunc)
	if err == nil {
		t.FailNow()
	}

	_, err = tc2.getOrAddToken(uid, noTokFunc)
	if err == nil {
		t.FailNow()
	}

	_, err = tc3.getOrAddToken(uid, noTokFunc)
	if err == nil {
		t.FailNow()
	}
}
