const base = require('../../package.json').build;

// Explicitly opt in: normal local builds keep their existing ad-hoc signature.
if (process.env.PGIT_MAC_SIGNING !== 'true') {
  throw new Error('Signed releases require PGIT_MAC_SIGNING=true');
}
for (const key of ['CSC_LINK', 'CSC_KEY_PASSWORD', 'CSC_NAME', 'APPLE_API_KEY', 'APPLE_API_KEY_ID', 'APPLE_API_ISSUER']) {
  if (!process.env[key]?.trim()) throw new Error(`Signed release requires ${key}`);
}
if (!process.env.CSC_NAME.startsWith('Developer ID Application:')) {
  throw new Error('CSC_NAME must identify a Developer ID Application certificate');
}
module.exports = {
  ...base,
  extends: null,
  afterPack: null,
  forceCodeSigning: true,
  mac: {
    ...base.mac,
    identity: process.env.CSC_NAME,
    hardenedRuntime: true,
    notarize: true,
    entitlements: 'desktop/signing/entitlements.mac.plist',
    entitlementsInherit: 'desktop/signing/entitlements.mac.plist',
  },
};
