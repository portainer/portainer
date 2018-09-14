package sshkeys

import (
	"encoding/hex"
	"net/http"	
    "time"
	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)


type sshkeyCreatePayload struct {
	Name string 
	Privatekeypath string
	Publickeypath string
	UserName string
	LastUsage string
}

func (payload *sshkeyCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid sshkey Name")
	}
	return nil
}

// POST request on /api/sshkeys
func (handler *Handler) sshkeyCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload sshkeyCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	sshkeys, err := handler.SshkeyService.Sshkeys()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve sshkeys from the database", err}
	}

	for _, sshkey := range sshkeys {
		if sshkey.Name == payload.Name {
			return &httperror.HandlerError{http.StatusConflict, "This name is already associated to a sshkey", portainer.ErrSshkeyAlreadyExists}
		}
	}

	privatepath, pubkeypath, errrrr := handler.DigitalSshkeyService.GenerateKeyPair()
	
	if (errrrr != nil){
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid Ssh key  payload", errrrr}
	}
	
	encodedStr := hex.EncodeToString(privatepath)
	encodedStr1 := hex.EncodeToString(pubkeypath)
	dateTime := time.Now().Local().Format("2006-01-02 15:04:05");
	
	sshkey := &portainer.Sshkey{
		Name: payload.Name,		
		Privatekeypath: encodedStr,
		Publickeypath: encodedStr1,
		UserName: payload.UserName,
		LastUsage: dateTime,
	}	

	err = handler.SshkeyService.CreateSshkey(sshkey)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the sshkey inside the database" , err}
	}
	
	return response.JSON(w, sshkey)
}
func BytesToString(data []byte) string {
	return string(data[:])
}