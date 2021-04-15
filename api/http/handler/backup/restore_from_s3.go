package backup

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/pkg/errors"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	operations "github.com/portainer/portainer/api/backup"
	s3client "github.com/portainer/portainer/api/s3"
)

type restoreS3Settings struct {
	portainer.S3Location
	Password string
}

func (p *restoreS3Settings) Validate(r *http.Request) error {
	if p.AccessKeyID == "" {
		return errors.New("missing AccessKeyID field")
	}
	if p.SecretAccessKey == "" {
		return errors.New("missing SecretAccessKe field")
	}
	if p.Region == "" {
		return errors.New("missing Region field")
	}
	if p.BucketName == "" {
		return errors.New("missing BucketName field")
	}
	if p.Filename == "" {
		return errors.New("missing Filename field")
	}
	return nil
}

// @id RestoreFromS3
// @summary Triggers a system restore using details of s3 backup
// @description Triggers a system restore using details of s3 backup
// @description **Access policy**: public
// @tags backup
// @param AccessKeyID body string false "AWS access key id"
// @param SecretAccessKey body string false "AWS secret access key"
// @param Region body string false "AWS S3 region"
// @param BucketName body string false "AWS S3 bucket name"
// @param Filename body string false "AWS S3 filename in the bucket"
// @param Password body string false "Password to decrypt the backup with"
// @success 200  "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /backup/s3/restore [post]
func (h *Handler) restoreFromS3(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	initialized, err := h.adminMonitor.WasInitialized()
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to check system initialization", Err: err}
	}
	if initialized {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Cannot restore already initialized instance", Err: fmt.Errorf("system already initialized")}
	}

	h.adminMonitor.Stop()
	defer h.adminMonitor.Start()

	var payload restoreS3Settings
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}

	backupFile, err := createTmpBackupLocation(h.filestorePath)
	if err != nil {
		log.Println(err)
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to restore", Err: err}
	}
	defer func() {
		backupFile.Close()
		os.RemoveAll(filepath.Dir(backupFile.Name()))
	}()

	s3session, err := s3client.NewSession(payload.Region, payload.AccessKeyID, payload.SecretAccessKey)
	if err != nil {
		log.Printf("[ERROR] %s \n", err)
	}
	if err = s3client.Download(s3session, backupFile, payload.S3Location); err != nil {
		log.Printf("[ERROR] %s \n", errors.Wrap(err, "failed downloading file from S3"))
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to download file from S3", Err: err}
	}

	if err = operations.RestoreArchive(backupFile, payload.Password, h.filestorePath, h.gate, h.dataStore, h.shutdownTrigger); err != nil {
		log.Printf("[ERROR] %s", errors.Wrap(err, "faild to restore system from backup"))
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to restore backup", Err: err}
	}

	return nil
}

func createTmpBackupLocation(filestorePath string) (*os.File, error) {
	restoreDir, err := ioutil.TempDir(filestorePath, fmt.Sprintf("restore_%s", time.Now().Format("2006-01-02_15-04-05")))
	if err != nil {
		return nil, errors.New("failed to create tmp download dir")
	}

	f, err := os.Create(filepath.Join(restoreDir, "backup_file"))
	if err != nil {
		return nil, errors.New("failed to create tmp download file")
	}

	return f, nil
}
