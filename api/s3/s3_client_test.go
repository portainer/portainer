package s3

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
)

var s3session *session.Session

const (
	existingBucket = "testbucket"
	key            = "testfile"
)

func TestMain(m *testing.M) {
	sess, stopMinio := startMinio()
	s3session = sess

	if _, err := s3.New(s3session).CreateBucket(&s3.CreateBucketInput{Bucket: aws.String(existingBucket)}); err != nil {
		log.Fatal(errors.Wrap(err, "failed to create bucket"))
	}

	m.Run()

	s3.New(s3session).DeleteObject(&s3.DeleteObjectInput{Bucket: aws.String(existingBucket), Key: aws.String(key)})
	s3.New(s3session).DeleteBucket(&s3.DeleteBucketInput{Bucket: aws.String(existingBucket)})
	stopMinio()
}

func Test_upload_shouldFail_whenBucketIsMissing(t *testing.T) {
	if err := Upload(s3session, strings.NewReader("test"), "unknown-bucket", key); err != nil {
		assert.Error(t, err, "should fail uploading to non existing bucket")
	}
}

func Test_upload_shouldFail_whenBucketExists(t *testing.T) {

	if err := Upload(s3session, strings.NewReader("test"), existingBucket, key); err != nil {
		assert.Nil(t, err, "should succeed uploading to existing bucket")
	}
}

func Test_download_shouldFail_whenBucketIsMissing(t *testing.T) {
	buf := aws.NewWriteAtBuffer([]byte{})
	err := Download(s3session, buf, portainer.S3Location{BucketName: "missing", Filename: key})
	assert.Error(t, err, "should fail downloading from a missing bucket")
}

func Test_download_shouldFail_whenFileIsMissing(t *testing.T) {
	buf := aws.NewWriteAtBuffer([]byte{})
	err := Download(s3session, buf, portainer.S3Location{BucketName: existingBucket, Filename: "missing-file"})
	assert.Error(t, err, "should fail downloading because file is missing")
}

func Test_download_shouldSucceed_whenFileExists(t *testing.T) {
	Upload(s3session, strings.NewReader("test"), existingBucket, key)

	buf := aws.NewWriteAtBuffer([]byte{})
	err := Download(s3session, buf, portainer.S3Location{BucketName: existingBucket, Filename: key})
	assert.Nil(t, err, "should succeed when file exists")
}

func startMinio() (*session.Session, func()) {
	up := exec.Command("docker-compose", "-f", "docker-compose.test.yml", "up", "-d")
	up.Stderr = os.Stderr
	if err := up.Run(); err != nil {
		log.Fatal(errors.Wrap(err, "failed to run docker-compose up"))
	}

	minioHost := "http://localhost:9090"

	// wait for minio to get up and running
	client := http.Client{
		Timeout: 50 * time.Millisecond,
	}
	for i := 0; i < 10; i++ {
		resp, _ := client.Get(fmt.Sprintf("%s/minio/health/live", minioHost))
		if resp != nil && resp.StatusCode == http.StatusOK {
			log.Println("[DEBUG] Minio is up and running")
			break
		}
		<-time.After(500 * time.Millisecond)
	}

	// create session
	sess, err := session.NewSessionWithOptions(session.Options{
		Config: aws.Config{
			Credentials:      credentials.NewStaticCredentials("minioadmin", "minioadmin", ""),
			Endpoint:         aws.String(minioHost),
			Region:           aws.String("us-east-1"),
			DisableSSL:       aws.Bool(true),
			S3ForcePathStyle: aws.Bool(true),
		}})
	if err != nil {
		log.Fatal(errors.Wrap(err, "failed to create minio session"))
	}

	return sess, func() {
		down := exec.Command("docker-compose", "-f", "docker-compose.test.yml", "rm", "-sfv")
		if err := down.Run(); err != nil {
			log.Fatal(errors.Wrap(err, "failed to run docker-compose rm"))
		}
	}
}
