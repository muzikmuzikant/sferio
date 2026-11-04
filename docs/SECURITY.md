# Security baseline

- Never store plaintext passwords. Use Argon2id.
- Never commit credentials, tokens, private environment files, student records, or real access codes.
- Store secrets only in deployment environment variables.
- Validate and authorize every sensitive action on the server.
- Rate-limit login, registration, password reset, posting, uploads, and voting endpoints.
- School access codes must be rotatable and must not be treated as proof of individual student identity.
- Password reset codes are one-time, short-lived, stored hashed, and audited.
- Teachers may initiate password resets only for students assigned to their class; administrators may assist any account.
- Keep student content behind authentication and prevent indexing.
- Log administrative actions without logging passwords, reset codes, private ballot choices, or uploaded image bytes.

## Photo upload controls

- Accept only JPEG/JPG, PNG, and WebP images; reject videos and all other file types.
- Enforce a hard server-side limit of 2 MB per original image and no more than 5 images per post.
- Verify actual image format by decoding content; do not trust extensions or browser-provided MIME types.
- Limit decoding to 40 megapixels to reduce decompression-bomb risk.
- Apply orientation, resize to at most 1920×1920, and re-encode as WebP.
- Re-encoding strips EXIF metadata, including embedded GPS coordinates.
- Store image bytes in PostgreSQL; do not expose storage paths or database credentials.
- Serve images only through authenticated, authorized access to the parent post.
- Apply upload rate limits and enforce the same size/type rules in the interface and server.
- Do not enable arbitrary file downloads, public image URLs, video uploads, or public bucket access.

## Roles and authorization

- Permission checks are performed on the server for every protected operation.
- Users may hold multiple global roles and class-scoped roles.
- Decorative profile badges never grant permissions.
- The initial administrator bootstrap is one-time and requires a private deployment secret.
- Administrative actions are written to the audit log.
