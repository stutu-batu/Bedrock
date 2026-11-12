# Android packaging notes — Bedrock v0.10.0

This release remains a PWA. Continue testing at the same HTTPS origin so IndexedDB data and biometric credentials remain associated with the same relying-party origin.

For Android installation, a Trusted Web Activity wrapper can package the deployed PWA, but Digital Asset Links must be configured for the final domain/package/signing certificate. A TWA does not copy or migrate the IndexedDB vault. Keep the same website origin when first packaging.

If a future Capacitor/native wrapper is chosen, plan and test an explicit encrypted backup/restore migration first. Do not silently move or reset the browser vault.
