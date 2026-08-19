package compose

import (
	"crypto/sha256"
	"encoding/hex"
	"io"
	"os"
	"path/filepath"
	"sort"

	"github.com/compose-spec/compose-go/v2/types"
	"github.com/rs/zerolog/log"
)

const BindMountHashLabelKey = "io.portainer.bind-mount-hash"

func addBindMountHashLabel(name string, s types.ServiceConfig) (types.ServiceConfig, error) {
	hashes := []string{}

	for _, volume := range s.Volumes {
		// Calculate hash for bind mounts only for now
		if volume.Type != "bind" {
			continue
		}

		// Calculate hash for volume.Source, volume.Source can be a file or dir
		// and volume.Source is already an absolute path so we can hash it directly
		hash, err := pathHash(volume.Source)
		if err != nil {
			// If we fail to calculate the hash for this bind mount, skip it and continue
			log.Debug().Err(err).
				Str("bind_mount_source", volume.Source).
				Str("service", name).
				Msg("failed to calculate hash for bind mount, skipping this bind mount from hash label calculation")
			continue
		}

		if hash != "" {
			hashes = append(hashes, hash)
		}
	}

	if len(hashes) == 0 {
		return s, nil
	}

	// Sort hashes to ensure deterministic output
	sort.Strings(hashes)

	// Final hash of the combined hashes
	finalH := sha256.New()
	for _, h := range hashes {
		finalH.Write([]byte(h))
	}

	value := hex.EncodeToString(finalH.Sum(nil))

	if s.Labels == nil {
		s.Labels = make(map[string]string)
	}
	s.Labels[BindMountHashLabelKey] = value

	log.Debug().Str("service", name).
		Str("label_key", BindMountHashLabelKey).
		Str("bind_mount_hash", value).
		Msg("Calculated bind mount hash for service")

	return s, nil
}

// pathHash calculates a SHA-256 hash for a file or a directory.
func pathHash(path string) (string, error) {
	hash := sha256.New()

	info, err := os.Stat(path)
	if err != nil {
		return "", err
	}

	if !info.IsDir() {
		// It's a single file
		return hashFile(path)
	}

	// It's a directory: we must collect and sort all files for determinism
	var files []string
	if err := filepath.Walk(path, func(p string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			files = append(files, p)
		}
		return nil
	}); err != nil {
		return "", err
	}
	sort.Strings(files)

	for _, f := range files {
		// Include the relative path in the hash so that renames and moves within
		// the directory change the hash even when file contents stay the same.
		relPath, err := filepath.Rel(path, f)
		if err != nil {
			return "", err
		}
		if _, err := hash.Write([]byte(relPath)); err != nil {
			return "", err
		}

		// Stream the file content into the same hasher
		if err := copyFileToHash(hash, f); err != nil {
			return "", err
		}
	}

	return hex.EncodeToString(hash.Sum(nil)), nil
}

func hashFile(path string) (string, error) {
	h := sha256.New()
	if err := copyFileToHash(h, path); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

// copyFileToHash opens the file at path, streams its content into w, and closes it.
// If the copy fails, the close error is logged but the copy error is returned.
// If the copy succeeds but close fails, the close error is returned.
func copyFileToHash(w io.Writer, path string) (err error) {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer func() {
		if cerr := f.Close(); cerr != nil {
			log.Debug().Err(cerr).
				Str("filename", path).
				Msg("error closing file after hash")
			if err == nil {
				err = cerr
			}
		}
	}()

	_, err = io.Copy(w, f)
	return err
}
