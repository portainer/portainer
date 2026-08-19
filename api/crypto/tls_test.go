package crypto

import (
	"crypto/tls"
	"testing"

	portainer "github.com/portainer/portainer/api"

	"github.com/stretchr/testify/require"
)

func TestCreateTLSConfiguration(t *testing.T) {
	t.Parallel()
	// InsecureSkipVerify = false
	config := CreateTLSConfiguration(false)
	require.Equal(t, config.MinVersion, uint16(tls.VersionTLS12)) //nolint:forbidigo
	require.False(t, config.InsecureSkipVerify)                   //nolint:forbidigo

	// InsecureSkipVerify = true
	config = CreateTLSConfiguration(true)
	require.Equal(t, config.MinVersion, uint16(tls.VersionTLS12)) //nolint:forbidigo
	require.True(t, config.InsecureSkipVerify)                    //nolint:forbidigo
}

func TestCreateTLSConfigurationFIPS(t *testing.T) {
	t.Parallel()
	fips := true

	fipsCipherSuites := []uint16{
		tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
		tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
		tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
		tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
	}

	fipsCurvePreferences := []tls.CurveID{tls.CurveP256, tls.CurveP384, tls.CurveP521}

	config := createTLSConfiguration(fips, false)
	require.Equal(t, config.MinVersion, uint16(tls.VersionTLS12))   //nolint:forbidigo
	require.Equal(t, config.MaxVersion, uint16(tls.VersionTLS13))   //nolint:forbidigo
	require.Equal(t, config.CipherSuites, fipsCipherSuites)         //nolint:forbidigo
	require.Equal(t, config.CurvePreferences, fipsCurvePreferences) //nolint:forbidigo
	require.False(t, config.InsecureSkipVerify)                     //nolint:forbidigo
}

func TestCreateTLSConfigurationFromBytes(t *testing.T) {
	t.Parallel()
	// No TLS
	config, err := CreateTLSConfigurationFromBytes(false, nil, nil, nil, false, false)
	require.NoError(t, err)
	require.Nil(t, config)

	// Skip TLS client/server verifications
	config, err = CreateTLSConfigurationFromBytes(true, nil, nil, nil, true, true)
	require.NoError(t, err)
	require.NotNil(t, config)

	// Empty TLS
	config, err = CreateTLSConfigurationFromBytes(true, nil, nil, nil, false, false)
	require.Error(t, err)
	require.Nil(t, config)
}

func TestCreateTLSConfigurationFromDisk(t *testing.T) {
	t.Parallel()
	// No TLS
	config, err := CreateTLSConfigurationFromDisk(portainer.TLSConfiguration{})
	require.NoError(t, err)
	require.Nil(t, config)

	// Skip TLS verifications
	config, err = CreateTLSConfigurationFromDisk(portainer.TLSConfiguration{
		TLS:           true,
		TLSSkipVerify: true,
	})
	require.NoError(t, err)
	require.NotNil(t, config)
}

func TestCreateTLSConfigurationFromDiskFIPS(t *testing.T) {
	t.Parallel()
	fips := true

	// Skipping TLS verifications cannot be done in FIPS mode
	config, err := createTLSConfigurationFromDisk(fips, portainer.TLSConfiguration{
		TLS:           true,
		TLSSkipVerify: true,
	})
	require.NoError(t, err)
	require.NotNil(t, config)
	require.False(t, config.InsecureSkipVerify) //nolint:forbidigo
}
