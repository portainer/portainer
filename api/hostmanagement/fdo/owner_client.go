package fdo

import (
	"bytes"
	"errors"
	"io"
	"net/http"
	"net/url"
	"strconv"
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
		"application/cbor",
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

func (c FDOOwnerClient) PutDeviceSVI(info ServiceInfo) error {
	values := url.Values{}
	values.Set("module", info.Module)
	values.Set("var", info.Var)
	values.Set("filename", info.Filename)
	values.Set("guid", info.GUID)
	values.Set("device", info.Device)
	values.Set("priority", strconv.Itoa(info.Priority))
	values.Set("os", info.OS)
	values.Set("version", info.Version)
	values.Set("arch", info.Arch)
	values.Set("crid", strconv.Itoa(info.CRID))
	values.Set("hash", info.Hash)

	resp, err := c.doDigestAuthReq(
		http.MethodPut,
		"api/v1/device/svi?"+values.Encode(),
		"application/octet-stream",
		strings.NewReader(string(info.Bytes)),
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

func (c FDOOwnerClient) PutDeviceSVIRaw(info url.Values, body []byte) error {
	resp, err := c.doDigestAuthReq(
		http.MethodPut,
		"api/v1/device/svi?"+info.Encode(),
		"application/octet-stream",
		strings.NewReader(string(body)),
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
