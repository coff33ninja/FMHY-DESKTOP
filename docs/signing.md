# Code Signing

## Self-Signed Certificate (Dev/Testing)

A self-signed cert is in `build/fmhy-browser.pfx` for testing on other machines.

### Install on another machine

To trust the cert on another Windows machine:

1. Copy `build/fmhy-browser.pfx` to the target machine
2. Install it to Trusted Root (right-click → Install PFX → **Local Machine** → **Trusted Root Certification Authorities**)
3. The signed exes will then run without SmartScreen warnings

### Credentials

- **Password**: `fmhy-browser-2026`
- **Thumbprint**: `2C60E3CBBE5DEC8EA2D47F2989871BB023B83A91`
- **Expires**: July 8, 2027

### Environment variables

```
CSC_LINK=<path-to>/fmhy-browser.pfx
CSC_KEY_PASSWORD=fmhy-browser-2026
```

These are set persistently via `[Environment]::SetEnvironmentVariable("CSC_LINK", "...", "User")` on the dev machine.

## SignPath Foundation (Production)

[SignPath Foundation](https://signpath.org) provides free OV-level code signing for open source projects. Their cert is trusted by Windows/SmartScreen.

### Setup

1. Apply at https://signpath.org/apply
2. Once approved, add `SIGNPATH_API_TOKEN` to GitHub secrets
3. The signing happens automatically in CI via GitHub Actions on release

### Workflow

```yaml
- uses: signpath/github-action-submit-signing-request@v1
  with:
    api-token: ${{ secrets.SIGNPATH_API_TOKEN }}
    organization-id: <org-id>
    project-slug: fmhy-browser
    signing-policy-slug: release-signing
    input-artifact-path: ./dist/FMHY Browser Setup *.exe
    output-artifact-directory: ./dist/signed
```
