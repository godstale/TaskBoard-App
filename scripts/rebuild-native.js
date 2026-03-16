/**
 * Installs the Electron-specific prebuilt binary for better-sqlite3.
 *
 * better-sqlite3 is compiled as a native module. `pnpm install` builds it
 * for the system Node.js ABI, but the Electron runtime uses a different ABI.
 * This script downloads the correct prebuilt binary for the installed Electron version.
 *
 * Run after `pnpm install`: `node scripts/rebuild-native.js`
 */

const { execSync, spawnSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const electronVersion = require(path.join(__dirname, '..', 'node_modules', 'electron', 'package.json')).version
console.log(`[rebuild-native] Electron version: ${electronVersion}`)

// Locate better-sqlite3 package
const bsqlitePkg = require.resolve('better-sqlite3/package.json')
const bsqliteDir = path.dirname(bsqlitePkg)
console.log(`[rebuild-native] better-sqlite3 dir: ${bsqliteDir}`)

// Locate prebuild-install
const prebuildBin = require.resolve('prebuild-install/bin.js', {
  paths: [bsqliteDir, path.join(__dirname, '..', 'node_modules')],
})

const args = [
  prebuildBin,
  `--runtime=electron`,
  `--target=${electronVersion}`,
  `--arch=${process.arch}`,
  `--platform=${process.platform}`,
  `--tag-prefix=v`,
  `--verbose`,
]

console.log(`[rebuild-native] Running: node ${args.join(' ')}`)
const result = spawnSync(process.execPath, args, {
  cwd: bsqliteDir,
  stdio: 'inherit',
})

if (result.status !== 0) {
  console.error('[rebuild-native] Failed to install prebuilt binary.')
  console.error('[rebuild-native] Try running: pnpm rebuild better-sqlite3')
  process.exit(1)
}

console.log('[rebuild-native] Successfully installed Electron-specific binary for better-sqlite3.')
