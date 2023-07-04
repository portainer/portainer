package filesystem

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/portainer/portainer/api"
)

// FilterDirForPerDevConfigs filers the given dirEntries, returns entries for the given device
// For given configPath A/B/C, return entries:
//  1. all entries outside of dir A
//  2. dir entries A, A/B, A/B/C
//  3. For filterType file:
//     file entries: A/B/C/<deviceName> and A/B/C/<deviceName>.*
//  4. For filterType dir:
//     dir entry:   A/B/C/<deviceName>
//     all entries: A/B/C/<deviceName>/*
func FilterDirForPerDevConfigs(dirEntries []DirEntry, deviceName, configPath string, filterType portainer.PerDevConfigsFilterType) []DirEntry {
	var filteredDirEntries []DirEntry

	for _, dirEntry := range dirEntries {
		if shouldIncludeEntry(dirEntry, deviceName, configPath, filterType) {
			filteredDirEntries = append(filteredDirEntries, dirEntry)
		}
	}

	return filteredDirEntries
}

func shouldIncludeEntry(dirEntry DirEntry, deviceName, configPath string, filterType portainer.PerDevConfigsFilterType) bool {

	// Include all entries outside of dir A
	if !isInConfigRootDir(dirEntry, configPath) {
		return true
	}

	// Include dir entries A, A/B, A/B/C
	if isParentDir(dirEntry, configPath) {
		return true
	}

	if filterType == portainer.PerDevConfigsTypeFile {
		// Include file entries A/B/C/<deviceName> or A/B/C/<deviceName>.*
		return shouldIncludeFile(dirEntry, deviceName, configPath)
	}

	// Include:
	// dir entry A/B/C/<deviceName>
	// all entries A/B/C/<deviceName>/*
	return shouldIncludeDir(dirEntry, deviceName, configPath)
}

func isInConfigRootDir(dirEntry DirEntry, configPath string) bool {
	// get the first element of the configPath
	rootDir := strings.Split(configPath, string(os.PathSeparator))[0]

	// return true if entry name starts with "A/"
	return strings.HasPrefix(dirEntry.Name, appendTailSeparator(rootDir))
}

func isParentDir(dirEntry DirEntry, configPath string) bool {
	if dirEntry.IsFile {
		return false
	}

	// return true for dir entries A, A/B, A/B/C
	return strings.HasPrefix(appendTailSeparator(configPath), appendTailSeparator(dirEntry.Name))
}

func shouldIncludeFile(dirEntry DirEntry, deviceName, configPath string) bool {
	if !dirEntry.IsFile {
		return false
	}

	// example: A/B/C/<deviceName>
	filterEqual := filepath.Join(configPath, deviceName)

	// example: A/B/C/<deviceName>/
	filterPrefix := fmt.Sprintf("%s.", filterEqual)

	// include file entries: A/B/C/<deviceName> or A/B/C/<deviceName>.*
	return dirEntry.Name == filterEqual || strings.HasPrefix(dirEntry.Name, filterPrefix)
}

func shouldIncludeDir(dirEntry DirEntry, deviceName, configPath string) bool {
	// example: A/B/C/'/<deviceName>
	filterEqual := filepath.Join(configPath, deviceName)

	// example: A/B/C/<deviceName>/
	filterPrefix := appendTailSeparator(filterEqual)

	// include dir entry: A/B/C/<deviceName>
	if !dirEntry.IsFile && dirEntry.Name == filterEqual {
		return true
	}

	// include all entries A/B/C/<deviceName>/*
	return strings.HasPrefix(dirEntry.Name, filterPrefix)
}

func appendTailSeparator(path string) string {
	return fmt.Sprintf("%s%c", path, os.PathSeparator)
}
