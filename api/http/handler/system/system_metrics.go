package system

import (
	"net/http"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type systemMetricsResponse struct {
	CPU      float64 `json:"cpu"`
	CPUCores int     `json:"cpuCores"`
	RAM      float64 `json:"ram"`
	RAMUsed  uint64  `json:"ramUsed"`
	RAMTotal uint64  `json:"ramTotal"`
	Disk     float64 `json:"disk"`
	DiskUsed uint64  `json:"diskUsed"`
	DiskTotal uint64 `json:"diskTotal"`
	DiskRead  uint64 `json:"diskRead"`
	DiskWrite uint64 `json:"diskWrite"`
}

func (handler *Handler) systemMetrics(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cpuPercents, err := cpu.Percent(200*time.Millisecond, false)
	cpuUsage := 0.0
	if err == nil && len(cpuPercents) > 0 {
		cpuUsage = cpuPercents[0]
	}

	cpuCores, _ := cpu.Counts(true)

	vmStat, err := mem.VirtualMemory()
	ramUsage := 0.0
	var ramUsed, ramTotal uint64
	if err == nil {
		ramUsage = vmStat.UsedPercent
		ramUsed = vmStat.Used
		ramTotal = vmStat.Total
	}

	diskStat, err := disk.Usage("/")
	diskUsage := 0.0
	var diskUsed, diskTotal uint64
	if err == nil {
		diskUsage = diskStat.UsedPercent
		diskUsed = diskStat.Used
		diskTotal = diskStat.Total
	}

	// Disk IO: snapshot two readings separated by 200ms
	ioCounters1, _ := disk.IOCounters()
	time.Sleep(200 * time.Millisecond)
	ioCounters2, _ := disk.IOCounters()

	var totalRead, totalWrite uint64
	for name, c2 := range ioCounters2 {
		if c1, ok := ioCounters1[name]; ok {
			totalRead += c2.ReadBytes - c1.ReadBytes
			totalWrite += c2.WriteBytes - c1.WriteBytes
		}
	}
	// Convert to bytes/s (divide by 0.2s interval)
	diskReadBps := uint64(float64(totalRead) / 0.2)
	diskWriteBps := uint64(float64(totalWrite) / 0.2)

	resp := systemMetricsResponse{
		CPU:       cpuUsage,
		CPUCores:  cpuCores,
		RAM:       ramUsage,
		RAMUsed:   ramUsed,
		RAMTotal:  ramTotal,
		Disk:      diskUsage,
		DiskUsed:  diskUsed,
		DiskTotal: diskTotal,
		DiskRead:  diskReadBps,
		DiskWrite: diskWriteBps,
	}

	return response.JSON(w, resp)
}
