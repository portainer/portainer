//go:build ignore

package gorules

import "github.com/quasilyte/go-ruleguard/dsl"

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
