package models

type (
	FDOConfiguration struct {
		Enabled       bool   `json:"enabled"`
		OwnerURL      string `json:"ownerURL"`
		OwnerUsername string `json:"ownerUsername"`
		OwnerPassword string `json:"ownerPassword"`
	}

	// FDOProfileID represents a fdo profile id
	FDOProfileID int

	FDOProfile struct {
		ID            FDOProfileID `json:"id"`
		Name          string       `json:"name"`
		FilePath      string       `json:"filePath"`
		NumberDevices int          `json:"numberDevices"`
		DateCreated   int64        `json:"dateCreated"`
	}
)
