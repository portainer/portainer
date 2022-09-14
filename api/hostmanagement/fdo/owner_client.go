package fdo

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/rkl-/digest"
)

type FDOOwnerClient struct {
	OwnerURL string
	Username string
	Password string
	Timeout  time.Duration
}

type ServiceInfo struct {
	Module   string
	Var      string
	Filename string
	Bytes    []byte
	GUID     string
	Device   string
	Priority int
	OS       string
	Version  string
	Arch     string
	CRID     int
	Hash     string
}

func (c FDOOwnerClient) doDigestAuthReq(method, endpoint, contentType string, body io.Reader) (*http.Response, error) {
	transport := digest.NewTransport(c.Username, c.Password)

	// TODO: REVIEW
	// Temporary work-around to support sending requests to HTTPS AIO local setups
	transport.Transport.(*http.Transport).TLSClientConfig = &tls.Config{InsecureSkipVerify: true}

	client, err := transport.Client()
	if err != nil {
		return nil, err
	}
	client.Timeout = c.Timeout

	e, err := url.Parse(endpoint)
	if err != nil {
		return nil, err
	}

	u, err := url.Parse(c.OwnerURL)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(method, u.ResolveReference(e).String(), body)
	if err != nil {
		return nil, err
	}

	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}

	return client.Do(req)
}

func (c FDOOwnerClient) PostVoucher(ov []byte) (string, error) {
	resp, err := c.doDigestAuthReq(
		http.MethodPost,
		"api/v1/owner/vouchers",
		"text/plain",
		bytes.NewReader(ov),
	)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		return "", errors.New(http.StatusText(resp.StatusCode))
	}

	return string(body), nil
}

// func (c FDOOwnerClient) PutDeviceSVI(info ServiceInfo) error {
// 	values := url.Values{}
// 	values.Set("module", info.Module)
// 	values.Set("var", info.Var)
// 	values.Set("filename", info.Filename)
// 	values.Set("guid", info.GUID)
// 	values.Set("device", info.Device)
// 	values.Set("priority", strconv.Itoa(info.Priority))
// 	values.Set("os", info.OS)
// 	values.Set("version", info.Version)
// 	values.Set("arch", info.Arch)
// 	values.Set("crid", strconv.Itoa(info.CRID))
// 	values.Set("hash", info.Hash)

// 	resp, err := c.doDigestAuthReq(
// 		http.MethodPut,
// 		"api/v1/device/svi?"+values.Encode(),
// 		"application/octet-stream",
// 		strings.NewReader(string(info.Bytes)),
// 	)
// 	if err != nil {
// 		return err
// 	}
// 	defer resp.Body.Close()

// 	if resp.StatusCode != http.StatusOK {
// 		return errors.New(http.StatusText(resp.StatusCode))
// 	}

// 	return nil
// }

// Sending SVI instruction
// curl -D - --digest -u ${api_user}: --location --request POST 'http://localhost:8080/api/v1/owner/svi' --header 'Content-Type: text/plain' --data-raw '[{"filedesc" : "setup.sh","resource" : "URL"}, {"write": "content_string"} {"exec" : ["bash","setup.sh"] }]'

// Uploading resources
// curl -D - --digest -u ${api_user}: --location --request POST 'http://localhost:8080/api/v1/owner/resource?filename=fileName' --header 'Content-Type: text/plain' --data-binary '@< path to file >'

func SVIInstructionsToString(SVIInstructions []json.RawMessage) (string, error) {
	data, err := json.Marshal(SVIInstructions)
	if err != nil {
		return "", err
	}

	return string(data), nil
}

// curl -k -D - --digest -u apiUser:U8MdQyV7W9TUXtG --location --request POST 'https://localhost:8443/api/v1/owner/svi' \
//     --header 'Content-Type: text/plain' \
//     --data-raw '[{"filedesc" : "sample.txt","resource" : "file.txt"}]'

// curl -k -D - --digest -u apiUser:U8MdQyV7W9TUXtG --location --request POST 'https://localhost:8443/api/v1/owner/resource?filename=file.txt' --header 'Content-Type: text/plain' --data-binary '@/tmp/file.txt'

func (c FDOOwnerClient) PostResource(fileName string, resourceContent []byte) error {
	params := url.Values{
		"filename": []string{fileName},
	}

	resp, err := c.doDigestAuthReq(
		http.MethodPost,
		"api/v1/owner/resource?"+params.Encode(),
		"text/plain",
		bytes.NewReader(resourceContent),
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return errors.New(http.StatusText(resp.StatusCode))
	}

	return nil
}

// TODO: REVIEW
// Review comments

// POST a SVI to the Owner service
// That SVI will instruct the device to retrieve a file called resourceName from the database and write it under the fileName path (in local process CWD? e.g. in agent CWD - not sure about that)

// To FileName
// From ResourceName
func (c FDOOwnerClient) PostSVI(fileName, resourceName string) error {
	op1 := json.RawMessage([]byte(fmt.Sprintf(`{"filedesc" : "%s", "resource": "%s"}`, fileName, resourceName)))

	data := []json.RawMessage{op1}
	payload, err := SVIInstructionsToString(data)
	if err != nil {
		return err
	}

	resp, err := c.doDigestAuthReq(
		http.MethodPost,
		"api/v1/owner/svi",
		"text/plain",
		bytes.NewReader([]byte(payload)),
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return errors.New(http.StatusText(resp.StatusCode))
	}

	return nil
}

// POST a SVI to the Owner service
// That SVI will instruct the device to retrieve a file called resourceName from the database and write it under the fileName path (in local process CWD? e.g. in agent CWD - not sure about that)
// It will then instruct the device to execute a command afterwards

// To FileName
// From ResourceName
// func (c FDOOwnerClient) PostSVIFileExec(fileName, resourceName string, execCommand []string) error {
// 	op1 := json.RawMessage([]byte(fmt.Sprintf(`{"filedesc" : "%s", "resource": "%s"}`, fileName, resourceName)))
// 	op2 := json.RawMessage([]byte(fmt.Sprintf(`{"exec" : ["%s"]}`, strings.Join(execCommand, "\",\""))))

// 	data := []json.RawMessage{op1, op2}
// 	payload, err := SVIInstructionsToString(data)
// 	if err != nil {
// 		return err
// 	}

// 	resp, err := c.doDigestAuthReq(
// 		http.MethodPost,
// 		"api/v1/owner/svi",
// 		"text/plain",
// 		strings.NewReader(payload),
// 	)
// 	if err != nil {
// 		return err
// 	}
// 	defer resp.Body.Close()

// 	if resp.StatusCode != http.StatusOK {
// 		return errors.New(http.StatusText(resp.StatusCode))
// 	}

// 	return nil
// }

// func (c FDOOwnerClient) PutDeviceSVIRaw(info url.Values, body []byte) error {
// 	resp, err := c.doDigestAuthReq(
// 		http.MethodPut,
// 		"api/v1/device/svi?"+info.Encode(),
// 		"application/octet-stream",
// 		strings.NewReader(string(body)),
// 	)
// 	if err != nil {
// 		return err
// 	}
// 	defer resp.Body.Close()

// 	if resp.StatusCode != http.StatusOK {
// 		return errors.New(http.StatusText(resp.StatusCode))
// 	}

// 	return nil
// }

func (c FDOOwnerClient) GetVouchers() ([]string, error) {
	resp, err := c.doDigestAuthReq(
		http.MethodGet,
		"api/v1/owner/vouchers",
		"",
		nil,
	)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New(http.StatusText(resp.StatusCode))
	}

	contents, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	guids := strings.FieldsFunc(
		strings.TrimSpace(string(contents)),
		func(c rune) bool {
			return c == ','
		},
	)

	return guids, nil
}

func (c FDOOwnerClient) DeleteVoucher(guid string) error {
	resp, err := c.doDigestAuthReq(
		http.MethodDelete,
		"api/v1/owner/vouchers?id="+guid,
		"",
		nil,
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return errors.New(http.StatusText(resp.StatusCode))
	}

	return nil
}

func (c FDOOwnerClient) GetDeviceSVI(guid string) (string, error) {
	resp, err := c.doDigestAuthReq(
		http.MethodGet,
		"api/v1/device/svi?guid="+guid,
		"",
		nil,
	)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		return "", errors.New(http.StatusText(resp.StatusCode))
	}

	return string(body), nil
}

func (c FDOOwnerClient) DeleteDeviceSVI(id string) error {
	resp, err := c.doDigestAuthReq(
		http.MethodDelete,
		"api/v1/device/svi?id="+id,
		"",
		nil,
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return errors.New(http.StatusText(resp.StatusCode))
	}

	return nil
}
