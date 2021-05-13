package jwt

import (
	"testing"
	"time"

	"github.com/dgrijalva/jwt-go"
	portainer "github.com/portainer/portainer/api"
)

var (
	mockSVC         *Service
	dummyExpiryTime time.Time
	dummyTokenData  *portainer.TokenData
)

func setup() error {
	var err error
	mockSVC, err = NewService("24h")
	if err != nil {
		return err
	}
	dummyExpiryTime = time.Now().Add(1 * time.Hour)
	dummyTokenData = &portainer.TokenData{
		Username: "Joe",
		ID:       1,
		Role:     1,
	}
	return nil
}

func TestGenerateSignedToken(t *testing.T) {
	if err := setup(); err != nil {
		t.Errorf("failed to complete testing setups, err: %v", err)
	}
	token, err := mockSVC.generateSignedToken(dummyTokenData, &dummyExpiryTime)
	if err != nil {
		t.Errorf("failed to generate signed token, err: %v", err)
	}
	parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			t.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return mockSVC.secret, nil
	})
	if err != nil {
		t.Errorf("failed to parse signed token, err: %v", err)
	}
	clmap := parsedToken.Claims.(jwt.MapClaims)
	if clmap["username"].(string) != dummyTokenData.Username {
		t.Errorf("unexpected user name, want: %s, got: %s", dummyTokenData.Username, clmap["username"].(string))
	}
	if int(clmap["id"].(float64)) != int(dummyTokenData.ID) {
		t.Errorf("unexpected user id, want: %d, got: %d", dummyTokenData.ID, int(clmap["id"].(float64)))
	}
	if int(clmap["role"].(float64)) != int(dummyTokenData.ID) {
		t.Errorf("unexpected role id, want: %d, got: %d", dummyTokenData.Role, int(clmap["exp"].(float64)))
	}
	if int64(clmap["exp"].(float64)) != dummyExpiryTime.Unix() {
		t.Errorf("unexpected expiry time, want: %d, got: %d", dummyExpiryTime.Unix(), clmap["exp"].(int64))
	}
}
