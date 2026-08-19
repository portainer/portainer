import { describe, it, expect } from 'vitest';

import { fullURIIntoRepoAndTag } from './utils';

describe('fullURIIntoRepoAndTag', () => {
  it('splits registry/image-repo:tag correctly', () => {
    const result = fullURIIntoRepoAndTag('registry.example.com/my-image:v1.0');
    expect(result).toEqual({
      repo: 'registry.example.com/my-image',
      tag: 'v1.0',
    });
  });

  it('splits image-repo:tag correctly', () => {
    const result = fullURIIntoRepoAndTag('nginx:latest');
    expect(result).toEqual({ repo: 'nginx', tag: 'latest' });
  });

  it('splits image-repo:port/image correctly', () => {
    const result = fullURIIntoRepoAndTag('registry.example.com:5000/my-image');
    expect(result).toEqual({
      repo: 'registry.example.com:5000/my-image',
      tag: 'latest',
    });
  });

  it('splits image-repo:port/image:tag correctly', () => {
    const result = fullURIIntoRepoAndTag(
      'registry.example.com:5000/my-image:v1'
    );
    expect(result).toEqual({
      repo: 'registry.example.com:5000/my-image',
      tag: 'v1',
    });
  });

  it('splits registry:port/image-repo:tag correctly', () => {
    const result = fullURIIntoRepoAndTag(
      'registry.example.com:5000/my-image:v2.1'
    );
    expect(result).toEqual({
      repo: 'registry.example.com:5000/my-image',
      tag: 'v2.1',
    });
  });

  it('handles empty string input', () => {
    const result = fullURIIntoRepoAndTag('');
    expect(result).toEqual({ repo: '', tag: 'latest' });
  });

  it('handles input with multiple colons', () => {
    const result = fullURIIntoRepoAndTag('registry:5000/namespace/image:v1.0');
    expect(result).toEqual({
      repo: 'registry:5000/namespace/image',
      tag: 'v1.0',
    });
  });

  it('handles input with @ symbol (digest)', () => {
    const result = fullURIIntoRepoAndTag(
      'myregistry.azurecr.io/image@sha256:123456'
    );
    expect(result).toEqual({
      repo: 'myregistry.azurecr.io/image@sha256',
      tag: '123456',
    });
  });
});
