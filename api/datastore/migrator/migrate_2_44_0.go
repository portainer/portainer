package migrator

import (
	"fmt"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"

	"github.com/rs/zerolog/log"
)

// backfillSourceInterval_2_44_0 copies AutoUpdate.Interval from each stack onto its linked
// Source.Interval. When a Source is shared by multiple stacks, the shortest interval wins.
func (m *Migrator) backfillSourceInterval_2_44_0() error {
	log.Info().Msg("backfilling Source.Interval from deprecated Stack.AutoUpdate.Interval")

	workflows, err := m.workflowService.ReadAll()
	if err != nil {
		return err
	}

	stackIDsBySource := make(map[portainer.SourceID][]portainer.StackID)
	referencedStackIDs := make(map[portainer.StackID]struct{})
	for _, wf := range workflows {
		for _, artifact := range wf.Artifacts {
			if artifact.StackID == 0 {
				continue
			}

			for _, file := range artifact.Files {
				stackIDsBySource[file.SourceID] = append(stackIDsBySource[file.SourceID], artifact.StackID)
				referencedStackIDs[artifact.StackID] = struct{}{}
			}
		}
	}

	intervalByStack := make(map[portainer.StackID]string, len(referencedStackIDs))
	for stackID := range referencedStackIDs {
		s, err := m.stackService.Read(stackID)
		if dataservices.IsErrObjectNotFound(err) {
			continue
		}
		if err != nil {
			return fmt.Errorf("failed to read stack %d: %w", stackID, err)
		}

		if s.AutoUpdate != nil && s.AutoUpdate.Interval != "" {
			intervalByStack[stackID] = s.AutoUpdate.Interval
		}
	}

	adminUserContext := source.InsecureNewAdminContext()

	for srcID, stackIDs := range stackIDsBySource {
		if err := m.stackService.Connection.UpdateTx(func(tx portainer.Transaction) error {
			return m.backfillSourceIntervalForGroup_2_44_0(tx, adminUserContext, srcID, stackIDs, intervalByStack)
		}); err != nil {
			return fmt.Errorf("failed to backfill interval for source %d: %w", srcID, err)
		}
	}

	for stackID := range intervalByStack {
		if err := m.stackService.Connection.UpdateTx(func(tx portainer.Transaction) error {
			return m.clearAutoUpdateInterval_2_44_0(tx, stackID)
		}); err != nil {
			return fmt.Errorf("failed to clear auto update interval for stack %d: %w", stackID, err)
		}
	}

	return nil
}

func (m *Migrator) backfillSourceIntervalForGroup_2_44_0(tx portainer.Transaction, adminUserContext source.UserContext, srcID portainer.SourceID, stackIDs []portainer.StackID, intervalByStack map[portainer.StackID]string) error {
	var (
		minInterval    time.Duration
		minIntervalStr string
	)

	for _, stackID := range stackIDs {
		intervalStr, ok := intervalByStack[stackID]
		if !ok {
			continue
		}

		interval, err := time.ParseDuration(intervalStr)
		if err != nil {
			return fmt.Errorf("failed to parse auto update interval %q for stack %d: %w", intervalStr, stackID, err)
		}

		if minIntervalStr == "" || interval < minInterval {
			minInterval = interval
			minIntervalStr = intervalStr
		}
	}

	if minIntervalStr == "" {
		return nil
	}

	src, err := m.sourceService.Tx(tx).Read(adminUserContext, srcID)
	if err != nil {
		return fmt.Errorf("failed to read source %d: %w", srcID, err)
	}

	src.Interval = minIntervalStr

	return m.sourceService.Tx(tx).Update(adminUserContext, srcID, src)
}

func (m *Migrator) clearAutoUpdateInterval_2_44_0(tx portainer.Transaction, stackID portainer.StackID) error {
	s, err := m.stackService.Tx(tx).Read(stackID)
	if dataservices.IsErrObjectNotFound(err) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("failed to read stack %d: %w", stackID, err)
	}

	if s.AutoUpdate == nil {
		return nil
	}

	s.AutoUpdate.Interval = ""

	return m.stackService.Tx(tx).Update(s.ID, s)
}
