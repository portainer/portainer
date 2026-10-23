//go:build ignore

package gorules

import "github.com/quasilyte/go-ruleguard/dsl"

// nestedDBTransaction flags a DataStore transaction started from inside another
// transaction closure. bbolt only allows one open write transaction at a time,
// so starting a second one while the first is still open deadlocks. This fires
// regardless of whether the inner transaction is opened through the same store
// variable or a different one, since there is only one underlying database.
func nestedDBTransaction(m dsl.Matcher) {
	m.Match(
		`$store.UpdateTx($fn)`,
		`$store.UpdateTxLowPriority($fn)`,
		`$store.ViewTx($fn)`,
	).
		Where(
			m["fn"].Contains(`$_.UpdateTx($_)`) ||
				m["fn"].Contains(`$_.UpdateTxLowPriority($_)`) ||
				m["fn"].Contains(`$_.ViewTx($_)`)).
		Report(`$fn starts another transaction while already running inside $store's transaction; only one write transaction can be open at a time, so this can deadlock`)
}

// dataStoreCallInsideTx flags a service accessed through the DataStore instead
// of the tx handle inside a transaction closure. The non-tx CRUD methods open
// their own transaction internally (see BaseDataService), so calling them from
// inside an already-open transaction is a nested transaction in disguise.
func dataStoreCallInsideTx(m dsl.Matcher) {
	m.Match(
		`$store.UpdateTx($fn)`,
		`$store.UpdateTxLowPriority($fn)`,
		`$store.ViewTx($fn)`,
	).
		Where(m["fn"].Contains(`$store.$service().$method($*_)`)).
		Report(`$service() is accessed through $store instead of the tx parameter inside this closure; the non-tx call starts its own transaction internally and can deadlock`)
}

// dataStoreArgInsideTx flags DataStore being passed as a bare call argument
// from inside a transaction closure, instead of the tx handle the closure
// received. Unlike dataStoreCallInsideTx (a direct $store.Service().Method()
// call), here DataStore is handed to another function as a parameter; if that
// function performs a write through it, the write opens its own transaction
// while $store's transaction is still open and deadlocks bbolt the same way,
// just one call deeper. This is the RefreshEcrSecret / BE-13315 sibling bug:
// registryutils.RefreshEcrSecret took a bare DataStore parameter instead of
// DataStoreTx, so callers with a tx in scope passed handler.DataStore instead,
// which deadlocked once EnsureRegTokenValid tried to persist a refreshed ECR
// token via tx.Registry().Update().
//
// InitialStorageDetection is exempted: the DataStore argument it receives is
// only touched from inside an async goroutine that runs (after a 30s sleep)
// well after this transaction has already closed, by design, so it can't
// deadlock.
func dataStoreArgInsideTx(m dsl.Matcher) {
	m.Match(
		`$store.UpdateTx($fn)`,
		`$store.UpdateTxLowPriority($fn)`,
		`$store.ViewTx($fn)`,
	).
		Where((m["fn"].Contains(`$_($*_, $_.DataStore, $*_)`) ||
			m["fn"].Contains(`$_($*_, $_.dataStore, $*_)`)) &&
			!m["fn"].Contains(`$_.InitialStorageDetection($*_)`)).
		Report(`$fn passes DataStore as an argument instead of the tx parameter received from $store's transaction closure; if the callee writes through it, this can start a second transaction and deadlock`)
}

// snapshotCallInsideTx flags SnapshotService.SnapshotEndpoint being called
// from inside a transaction closure. SnapshotEndpoint has no tx handle of its
// own; snapshot.Service.SnapshotEndpoint forwards to SnapshotEndpointTx using
// the service's own DataStore instead of the caller's tx, so calling it while
// $store's transaction is still open starts a second one and deadlocks bbolt
// the same way as dataStoreCallInsideTx above, just through a different
// service. This is the CloudManagementService.updateEndpoint sibling bug:
// updateEndpoint took a tx parameter and called
// service.snapshotService.SnapshotEndpoint(endpoint) instead of casting to
// *snapshot.Service and calling SnapshotEndpointTx(tx, endpoint).
func snapshotCallInsideTx(m dsl.Matcher) {
	m.Match(
		`$store.UpdateTx($fn)`,
		`$store.UpdateTxLowPriority($fn)`,
		`$store.ViewTx($fn)`,
	).
		Where(m["fn"].Contains(`$_.SnapshotEndpoint($*_)`)).
		Report(`$fn calls SnapshotEndpoint while already running inside $store's transaction; SnapshotEndpoint opens its own transaction internally (see snapshot.Service.SnapshotEndpointTx), so this can deadlock`)
}

// dataStoreCallBypassingTxParam flags a DataStore service accessed directly,
// or SnapshotEndpoint called, from inside a function that already received a
// tx dataservices.DataStoreTx parameter. The tx parameter exists so the
// function reuses the caller's transaction; going through DataStore instead
// opens a second one, and if the DataStore method is a write, this deadlocks
// bbolt's single-writer lock exactly like dataStoreCallInsideTx above, just
// one call deeper. This is the BE-13315 bug: updateKubernetesStack took a tx
// parameter but called handler.DataStore.Stack().Update() directly instead of
// tx.Stack().Update(), which deadlocked Portainer's database writer for the
// life of the process. SnapshotEndpoint is flagged for the same reason as
// snapshotCallInsideTx above, one call deeper: CloudManagementService.updateEndpoint
// took a tx parameter but called service.snapshotService.SnapshotEndpoint(endpoint)
// instead of SnapshotEndpointTx(tx, endpoint).
func dataStoreCallBypassingTxParam(m dsl.Matcher) {
	m.Match(
		`func $name(tx $_) $*_ { $*_ }`,
		`func $name(tx $_, $_ $_) $*_ { $*_ }`,
		`func $name(tx $_, $_ $_, $_ $_) $*_ { $*_ }`,
		`func $name(tx $_, $_ $_, $_ $_, $_ $_) $*_ { $*_ }`,
		`func $name($_ $_, tx $_) $*_ { $*_ }`,
		`func $name($_ $_, tx $_, $_ $_) $*_ { $*_ }`,
		`func $name($_ $_, tx $_, $_ $_, $_ $_) $*_ { $*_ }`,
		`func $name($_ $_, tx $_, $_ $_, $_ $_, $_ $_) $*_ { $*_ }`,
		`func $name($_ $_, $_ $_, tx $_) $*_ { $*_ }`,
		`func $name($_ $_, $_ $_, tx $_, $_ $_) $*_ { $*_ }`,
		`func $name($_ $_, $_ $_, tx $_, $_ $_, $_ $_) $*_ { $*_ }`,
		`func $name($_ $_, $_ $_, tx $_, $_ $_, $_ $_, $_ $_) $*_ { $*_ }`,
		`func ($_ $_) $name(tx $_) $*_ { $*_ }`,
		`func ($_ $_) $name(tx $_, $_ $_) $*_ { $*_ }`,
		`func ($_ $_) $name(tx $_, $_ $_, $_ $_) $*_ { $*_ }`,
		`func ($_ $_) $name(tx $_, $_ $_, $_ $_, $_ $_) $*_ { $*_ }`,
		`func ($_ $_) $name($_ $_, tx $_) $*_ { $*_ }`,
		`func ($_ $_) $name($_ $_, tx $_, $_ $_) $*_ { $*_ }`,
		`func ($_ $_) $name($_ $_, tx $_, $_ $_, $_ $_) $*_ { $*_ }`,
		`func ($_ $_) $name($_ $_, tx $_, $_ $_, $_ $_, $_ $_) $*_ { $*_ }`,
		`func ($_ $_) $name($_ $_, $_ $_, tx $_) $*_ { $*_ }`,
		`func ($_ $_) $name($_ $_, $_ $_, tx $_, $_ $_) $*_ { $*_ }`,
		`func ($_ $_) $name($_ $_, $_ $_, tx $_, $_ $_, $_ $_) $*_ { $*_ }`,
		`func ($_ $_) $name($_ $_, $_ $_, tx $_, $_ $_, $_ $_, $_ $_) $*_ { $*_ }`,
	).
		Where(
			// Each exemption is scoped to the specific branch it excuses, not
			// ANDed across the whole expression: a function can legitimately
			// call InitialStorageDetection (or EndpointIDByEdgeID) *and*
			// separately have a real violation elsewhere in its body, and an
			// exemption ANDed across every branch would blanket-suppress that
			// real violation too. This is the exact reason
			// CloudManagementService.updateEndpoint's SnapshotEndpoint bug
			// stayed undetected even after this branch was added: the function
			// also calls kubeutils.InitialStorageDetection(tx, service.dataStore, ...),
			// so a whole-expression AND-NOT here would have hidden the
			// SnapshotEndpoint finding behind that unrelated, legitimate call.
			(m["$$"].Contains(`$_.DataStore.$_().$_($*_)`) &&
				// EndpointIDByEdgeID is a plain in-memory, mutex-guarded index
				// lookup with no underlying transaction, so it can't deadlock;
				// exempt it to avoid flagging that specific known-safe call.
				!m["$$"].Contains(`$_.DataStore.Endpoint().EndpointIDByEdgeID($*_)`)) ||
				((m["$$"].Contains(`$_($*_, $_.DataStore, $*_)`) ||
					m["$$"].Contains(`$_($*_, $_.dataStore, $*_)`)) &&
					// InitialStorageDetection only touches its DataStore
					// argument from an async goroutine that runs after this
					// function's transaction has already closed, by design,
					// so it can't deadlock; see dataStoreArgInsideTx above for
					// the full explanation.
					!m["$$"].Contains(`$_.InitialStorageDetection($*_)`)) ||
				m["$$"].Contains(`$_.SnapshotEndpoint($*_)`)).
		Report(`$name receives a tx parameter but also accesses DataStore directly, either via a method call, as an argument, or through SnapshotEndpoint, instead of using tx; the non-tx path can start its own transaction and deadlock`)
}
