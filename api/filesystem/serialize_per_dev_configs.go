package filesystem

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	portainer "github.com/portainer/portainer/api"
)

type MultiFilterArgs []struct {
	FilterKey  string
	FilterType portainer.PerDevConfigsFilterType
}

// MultiFilterDirForPerDevConfigs filers the given dirEntries with multiple filter args, returns the merged entries for the given device
func MultiFilterDirForPerDevConfigs(dirEntries []DirEntry, configPath string, multiFilterArgs MultiFilterArgs) ([]DirEntry, []string) {
	var filteredDirEntries []DirEntry

	var envFiles []string

	for _, multiFilterArg := range multiFilterArgs {
		tmp, efs := FilterDirForPerDevConfigs(dirEntries, multiFilterArg.FilterKey, configPath, multiFilterArg.FilterType)
		filteredDirEntries = append(filteredDirEntries, tmp...)

		envFiles = append(envFiles, efs...)
	}

	return deduplicate(filteredDirEntries), envFiles
}

// MultiFilterDirForPerDevConfigsWithDefaults filers the given dirEntries with multiple filter args, returns the merged entries for the given device
// and always includes the defaultFilenames
func MultiFilterDirForPerDevConfigsWithDefaults(dirEntries []DirEntry, configPath string, multiFilterArgs MultiFilterArgs, defaultFilenames []string) ([]DirEntry, []string) {

	filteredDirEntries, envFiles := MultiFilterDirForPerDevConfigs(dirEntries, configPath, multiFilterArgs)

	// Add files that should always be included
	// e.g. entrypoint files
	defaultDirEntries := GetDirEntriesByFilenames(dirEntries, defaultFilenames)
	filteredDirEntries = append(filteredDirEntries, defaultDirEntries...)

	return deduplicate(filteredDirEntries), envFiles
}

func deduplicate(dirEntries []DirEntry) []DirEntry {
	var deduplicatedDirEntries []DirEntry

	marks := make(map[string]struct{})

	for _, dirEntry := range dirEntries {
		if _, ok := marks[dirEntry.Name]; !ok {
			marks[dirEntry.Name] = struct{}{}
			deduplicatedDirEntries = append(deduplicatedDirEntries, dirEntry)
		}
	}

	return deduplicatedDirEntries
}

// FilterDirForPerDevConfigs filers the given dirEntries, returns entries for the given device
// For given configPath A/B/C, return entries:
//  1. all entries outside of dir A/B/C
//  2. For filterType file:
//     file entries: A/B/C/<deviceName> and A/B/C/<deviceName>.*
//  3. For filterType dir:
//     dir entry:   A/B/C/<deviceName>
//     all entries: A/B/C/<deviceName>/*
func FilterDirForPerDevConfigs(dirEntries []DirEntry, deviceName, configPath string, filterType portainer.PerDevConfigsFilterType) ([]DirEntry, []string) {
	var filteredDirEntries []DirEntry

	var envFiles []string

	for _, dirEntry := range dirEntries {
		if shouldIncludeEntry(dirEntry, deviceName, configPath, filterType) {
			filteredDirEntries = append(filteredDirEntries, dirEntry)

			if shouldParseEnvVars(dirEntry, deviceName, configPath, filterType) {
				envFiles = append(envFiles, dirEntry.Name)
			}
		}
	}

	return filteredDirEntries, envFiles
}

func shouldIncludeEntry(dirEntry DirEntry, deviceName, configPath string, filterType portainer.PerDevConfigsFilterType) bool {
	// Include all entries outside of dir A
	if !isInConfigDir(dirEntry, configPath) {
		return true
	}

	if filterType == portainer.PerDevConfigsTypeFile {
		// Include file entries A/B/C/<deviceName> or A/B/C/<deviceName>.*
		return shouldIncludeFile(dirEntry, deviceName, configPath)
	}

	if filterType == portainer.PerDevConfigsTypeDir {
		// Include:
		// dir entry A/B/C/<deviceName>
		// all entries A/B/C/<deviceName>/*
		return shouldIncludeDir(dirEntry, deviceName, configPath)
	}

	return false
}

func isInConfigDir(dirEntry DirEntry, configPath string) bool {
	// return true if entry name starts with "A/B"
	return strings.HasPrefix(dirEntry.Name, appendTailSeparator(configPath))
}

func shouldIncludeFile(dirEntry DirEntry, deviceName, configPath string) bool {
	if !dirEntry.IsFile {
		return false
	}

	// example: A/B/C/<deviceName>
	filterEqual := filepath.Join(configPath, deviceName)

	// example: A/B/C/<deviceName>/
	filterPrefix := filterEqual + "."

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

func shouldParseEnvVars(dirEntry DirEntry, deviceName, configPath string, filterType portainer.PerDevConfigsFilterType) bool {
	if !dirEntry.IsFile {
		return false
	}

	return isInConfigDir(dirEntry, configPath) &&
		filepath.Base(dirEntry.Name) == deviceName+".env"
}

func appendTailSeparator(path string) string {
	return fmt.Sprintf("%s%c", path, os.PathSeparator)
}
