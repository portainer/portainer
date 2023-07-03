package filesystem

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type FilterType string

const (
	FilterTypeFile FilterType = "file"
	FilterTypeDir  FilterType = "dir"
)

// FilterDirForPerDevConfigs filers the given dirEntries, returns entries for the given device
func FilterDirForPerDevConfigs(dirEntries []DirEntry, deviceName, configPath string, filterType FilterType) []DirEntry {
	var filteredDirEntries []DirEntry

	for _, dirEntry := range dirEntries {
		if shouldIncludeEntry(dirEntry, deviceName, configPath, filterType) {
			filteredDirEntries = append(filteredDirEntries, dirEntry)
		}
	}

	return filteredDirEntries
}

func isParentDir(dirEntry DirEntry, configPath string) bool {
	if dirEntry.IsFile {
		return false
	}

	return strings.HasPrefix(configPath, appendTailSeparator(dirEntry.Name))
}

func shouldIncludeFile(dirEntry DirEntry, deviceName, configPath string) bool {
	if !dirEntry.IsFile {
		return false
	}

	filterEqual := filepath.Join(configPath, deviceName)
	filterPrefix := fmt.Sprintf("%s.", filterEqual)

	// include file: <configPath>/<deviceName> or <configPath>/<deviceName>.*
	return dirEntry.Name == filterEqual || strings.HasPrefix(dirEntry.Name, filterPrefix)
}

func shouldIncludeDir(dirEntry DirEntry, deviceName, configPath string) bool {
	filterEqual := filepath.Join(configPath, deviceName)
	filterPrefix := appendTailSeparator(filterEqual)

	// include dir: <configPath>/<deviceName>
	if !dirEntry.IsFile && dirEntry.Name == filterEqual {
		return true
	}

	// include file and dir: <configPath>/<deviceName>/*
	return strings.HasPrefix(dirEntry.Name, filterPrefix)
}

func isInConfigRootDir(dirEntry DirEntry, configPath string) bool {
	// get the first element of the configPath
	rootDir := strings.Split(configPath, string(os.PathSeparator))[0]

	return strings.HasPrefix(dirEntry.Name, appendTailSeparator(rootDir))
}

func shouldIncludeEntry(dirEntry DirEntry, deviceName, configPath string, filterType FilterType) bool {
	if !isInConfigRootDir(dirEntry, configPath) {
		return true
	}

	if isParentDir(dirEntry, configPath) {
		return true
	}

	if filterType == FilterTypeFile {
		return shouldIncludeFile(dirEntry, deviceName, configPath)
	}

	return shouldIncludeDir(dirEntry, deviceName, configPath)
}

func appendTailSeparator(path string) string {
	return fmt.Sprintf("%s%c", path, os.PathSeparator)
}
