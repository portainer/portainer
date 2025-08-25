package cli

import (
	"io"
	"os"
	"strings"
	"testing"

	zerolog "github.com/rs/zerolog/log"
	"github.com/stretchr/testify/require"
)

func TestOptionParser(t *testing.T) {
	p := Service{}
	require.NotNil(t, p)

	a := os.Args
	defer func() { os.Args = a }()

	os.Args = []string{"portainer", "--edge-compute"}

	opts, err := p.ParseFlags("2.34.5")
	require.NoError(t, err)

	require.False(t, *opts.HTTPDisabled)
	require.True(t, *opts.EnableEdgeComputeFeatures)
}

func TestParseTLSFlags(t *testing.T) {
	testCases := []struct {
		name                string
		args                []string
		expectedTLSFlag     bool
		expectedTLSCertFlag string
		expectedTLSKeyFlag  string
		expectedLogMessages []string
	}{
		{
			name:                "no flags",
			expectedTLSFlag:     false,
			expectedTLSCertFlag: "",
			expectedTLSKeyFlag:  "",
		},
		{
			name: "only ssl flag",
			args: []string{
				"portainer",
				"--ssl",
			},
			expectedTLSFlag:     true,
			expectedTLSCertFlag: "",
			expectedTLSKeyFlag:  "",
		},
		{
			name: "only tls flag",
			args: []string{
				"portainer",
				"--tlsverify",
			},
			expectedTLSFlag:     true,
			expectedTLSCertFlag: defaultTLSCertPath,
			expectedTLSKeyFlag:  defaultTLSKeyPath,
		},
		{
			name: "partial ssl flags",
			args: []string{
				"portainer",
				"--ssl",
				"--sslcert=ssl-cert-flag-value",
			},
			expectedTLSFlag:     true,
			expectedTLSCertFlag: "ssl-cert-flag-value",
			expectedTLSKeyFlag:  "",
		},
		{
			name: "partial tls flags",
			args: []string{
				"portainer",
				"--tlsverify",
				"--tlscert=tls-cert-flag-value",
			},
			expectedTLSFlag:     true,
			expectedTLSCertFlag: "tls-cert-flag-value",
			expectedTLSKeyFlag:  defaultTLSKeyPath,
		},
		{
			name: "partial tls and ssl flags",
			args: []string{
				"portainer",
				"--tlsverify",
				"--tlscert=tls-cert-flag-value",
				"--sslkey=ssl-key-flag-value",
			},
			expectedTLSFlag:     true,
			expectedTLSCertFlag: "tls-cert-flag-value",
			expectedTLSKeyFlag:  "ssl-key-flag-value",
		},
		{
			name: "partial tls and ssl flags 2",
			args: []string{
				"portainer",
				"--ssl",
				"--tlscert=tls-cert-flag-value",
				"--sslkey=ssl-key-flag-value",
			},
			expectedTLSFlag:     true,
			expectedTLSCertFlag: "tls-cert-flag-value",
			expectedTLSKeyFlag:  "ssl-key-flag-value",
		},
		{
			name: "ssl flags",
			args: []string{
				"portainer",
				"--ssl",
				"--sslcert=ssl-cert-flag-value",
				"--sslkey=ssl-key-flag-value",
			},
			expectedTLSFlag:     true,
			expectedTLSCertFlag: "ssl-cert-flag-value",
			expectedTLSKeyFlag:  "ssl-key-flag-value",
			expectedLogMessages: []string{
				"the \\\"ssl\\\" flag is deprecated. use \\\"tlsverify\\\" instead.",
				"the \\\"sslcert\\\" flag is deprecated. use \\\"tlscert\\\" instead.",
				"the \\\"sslkey\\\" flag is deprecated. use \\\"tlskey\\\" instead.",
			},
		},
		{
			name: "tls flags",
			args: []string{
				"portainer",
				"--tlsverify",
				"--tlscert=tls-cert-flag-value",
				"--tlskey=tls-key-flag-value",
			},
			expectedTLSFlag:     true,
			expectedTLSCertFlag: "tls-cert-flag-value",
			expectedTLSKeyFlag:  "tls-key-flag-value",
		},
		{
			name: "tls and ssl flags",
			args: []string{
				"portainer",
				"--tlsverify",
				"--tlscert=tls-cert-flag-value",
				"--tlskey=tls-key-flag-value",
				"--ssl",
				"--sslcert=ssl-cert-flag-value",
				"--sslkey=ssl-key-flag-value",
			},
			expectedTLSFlag:     true,
			expectedTLSCertFlag: "tls-cert-flag-value",
			expectedTLSKeyFlag:  "tls-key-flag-value",
			expectedLogMessages: []string{
				"the \\\"ssl\\\" flag is deprecated. use \\\"tlsverify\\\" instead.",
				"the \\\"sslcert\\\" flag is deprecated. use \\\"tlscert\\\" instead.",
				"the \\\"sslkey\\\" flag is deprecated. use \\\"tlskey\\\" instead.",
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			var logOutput strings.Builder
			setupLogOutput(t, &logOutput)

			if tc.args == nil {
				tc.args = []string{"portainer"}
			}
			setOsArgs(t, tc.args)

			s := Service{}
			flags, err := s.ParseFlags("test-version")
			if err != nil {
				t.Fatalf("error parsing flags: %v", err)
			}

			if flags.TLS == nil {
				t.Fatal("TLS flag was nil")
			}

			require.Equal(t, tc.expectedTLSFlag, *flags.TLS, "tlsverify flag didn't match")
			require.Equal(t, tc.expectedTLSCertFlag, *flags.TLSCert, "tlscert flag didn't match")
			require.Equal(t, tc.expectedTLSKeyFlag, *flags.TLSKey, "tlskey flag didn't match")

			for _, expectedLogMessage := range tc.expectedLogMessages {
				require.Contains(t, logOutput.String(), expectedLogMessage, "Log didn't contain expected message")
			}
		})
	}
}

func setOsArgs(t *testing.T, args []string) {
	t.Helper()
	previousArgs := os.Args
	os.Args = args
	t.Cleanup(func() {
		os.Args = previousArgs
	})
}

func setupLogOutput(t *testing.T, w io.Writer) {
	t.Helper()

	oldLogger := zerolog.Logger
	zerolog.Logger = zerolog.Output(w)
	t.Cleanup(func() {
		zerolog.Logger = oldLogger
	})
}
