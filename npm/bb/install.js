// Postinstall script: verifies the platform binary is available
const path = require("path");
const fs = require("fs");

const PLATFORMS = {
  "darwin-arm64": "bbctl-darwin-arm64",
  "darwin-x64": "bbctl-darwin-x64",
  "linux-x64": "bbctl-linux-x64-gnu",
  "win32-x64": "bbctl-win32-x64-msvc",
};

const platformKey = `${process.platform}-${process.arch}`;
const pkg = PLATFORMS[platformKey];

if (!pkg) {
  console.warn(
    `Warning: bigbrother-bb does not have a prebuilt binary for ${platformKey}.`
  );
  process.exit(0);
}

try {
  const pkgPath = require.resolve(`${pkg}/package.json`);
  const dir = path.dirname(pkgPath);
  const binName = process.platform === "win32" ? "bb.exe" : "bb";
  const binPath = path.join(dir, "bin", binName);

  if (!fs.existsSync(binPath)) {
    console.warn(`Warning: Binary not found at ${binPath}`);
    process.exit(0);
  }

  // Ensure binary is executable
  if (process.platform !== "win32") {
    fs.chmodSync(binPath, 0o755);
  }
} catch (e) {
  console.warn(
    `Warning: Optional dependency ${pkg} not installed. bb may not work on this platform.`
  );
}
