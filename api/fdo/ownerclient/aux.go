package ownerclient

import (
	"errors"
	"io"
	"net/http"
	"strings"
)

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
