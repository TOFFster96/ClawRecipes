# Installation

This repo is an **OpenClaw plugin** (not a standalone CLI). OpenClaw loads it and exposes the commands under:

- `openclaw recipes ...`

## Prerequisites
- OpenClaw installed and working (`openclaw --version`)
- Node.js available (OpenClaw uses Node to load plugins)
- (For `recipes install`) you’ll need access to ClawHub (the command runs `npx clawhub@latest ...`).

## Install
### Option A (preferred): install from npm
Once published, you can install directly via npm:

```bash
openclaw plugins install @jiggai/recipes

# If you have plugins.allow set (plugin allowlist), you must explicitly add "recipes"
# or OpenClaw will refuse to load it.
openclaw config get plugins.allow --json
# then add "recipes" and set it back, e.g.
openclaw config set plugins.allow --json '["memory-core","telegram","recipes"]'

openclaw gateway restart
openclaw plugins list
```

### Option B: install from GitHub
```bash
git clone https://github.com/JIGGAI/ClawRecipes.git ~/clawrecipes
openclaw plugins install --link ~/clawrecipes
openclaw gateway restart
openclaw plugins list
```

### Option B: already cloned
```bash
openclaw plugins install --link ~/clawrecipes
openclaw gateway restart
openclaw plugins list
```

Confirm it loaded:
```bash
openclaw plugins list
# look for id: recipes
```

4) Try a basic command:
```bash
openclaw recipes list
```

## Updating the plugin
If you pull a newer version from GitHub, restart the gateway so OpenClaw reloads the plugin:

```bash
cd ~/clawrecipes
git pull
openclaw gateway restart
```

## Uninstall / disable
If installed via local path, remove the plugin install entry and restart:

```bash
openclaw plugins uninstall recipes
openclaw gateway restart
```

(If `plugins uninstall` is not available in your build, remove the path from your OpenClaw config’s plugin load paths and restart.)

## Troubleshooting
### Plugin loads but commands are missing
- Restart: `openclaw gateway restart`
- Check: `openclaw plugins list`
- Verify `openclaw.plugin.json` exists at repo root and has `id: "recipes"`.

### "Unknown command" (e.g. cleanup-workspaces)
This usually means the OpenClaw process is using an older or different plugin build:

1. **If installed from npm**  
   The published version may not include newer commands yet. Use a local install instead:
   ```bash
   openclaw plugins install --link /path/to/ClawRecipes
   openclaw gateway restart
   ```

2. **If using `--link`**  
   Confirm the path points at the ClawRecipes repo with the latest changes, then restart:
   ```bash
   openclaw gateway restart
   ```

3. **Version mismatch**  
   Kitchen (and any process spawning `openclaw`) must use the same OpenClaw binary and config as the one where the plugin is loaded. Check:
   ```bash
   which openclaw
   openclaw recipes list
   openclaw recipes cleanup-workspaces --json
   ```

### `recipes install` fails
- Run `npx clawhub@latest --help` to confirm the CLI can run.
- Ensure you are logged into ClawHub if required (`npx clawhub@latest login`).
- Confirm the install scope you intended:
  - global: `~/.openclaw/skills/<skill>`
  - agent: `~/.openclaw/workspace-<agentId>/skills/<skill>`
  - team: `~/.openclaw/workspace-<teamId>/skills/<skill>`
- If you change installs or config, restart: `openclaw gateway restart`.
