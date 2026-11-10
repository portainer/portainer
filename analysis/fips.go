//go:build ignore

package gorules

import "github.com/quasilyte/go-ruleguard/dsl"

// azureCertAuthPath flags the Azure service-principal certificate auth path — decoding a PKCS#12
// bundle (DES/SHA-1/PBKDF2) and building a client-certificate credential — which is not FIPS-approved.
// The only sanctioned call site is package api/azure, where it is gated behind fips.FIPSMode().
func azureCertAuthPath(m dsl.Matcher) {
	m.Match(`pkcs12.DecodeChain($*_)`).
		Where(!m.File().PkgPath.Matches(`(^|/)api/azure$`)).
		Report(`PKCS#12 decoding is not allowed because of FIPS mode; Azure certificate auth lives in package api/azure`)

	m.Match(`azidentity.NewClientCertificateCredential($*_)`).
		Where(!m.File().PkgPath.Matches(`(^|/)api/azure$`)).
		Report(`Azure certificate credential auth is not allowed because of FIPS mode; it is gated behind fips.FIPSMode() in package api/azure`)
}

// helmChartVerification flags any attempt to enable Helm chart provenance verification.
// Verification resolves to downloader.VerifyChart and then provenance.NewFromKeyring, which
// uses openpgp and is not FIPS-approved.
//
// forbidigo covers the selector form (opts.Verify = true) and the VerificationStrategy
// constants. It cannot see composite-literal keys, which are bare identifiers rather than
// selector expressions, so those are matched here.
func helmChartVerification(m dsl.Matcher) {
	m.Match(`action.ChartPathOptions{$*_, Verify: $_, $*_}`,
		`action.Dependency{$*_, Verify: $_, $*_}`,
		`downloader.Manager{$*_, Verify: $_, $*_}`,
		`downloader.ChartDownloader{$*_, Verify: $_, $*_}`).
		Report(`chart provenance verification uses openpgp; not allowed because of FIPS mode`)
}
