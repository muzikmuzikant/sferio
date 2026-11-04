# Security baseline

- Never store plaintext passwords. Use a modern password hash (Argon2id preferred).
- Never commit credentials, tokens, private environment files, student records, or real access codes.
- Store secrets only in deployment environment variables.
- Validate and authorize every sensitive action on the server.
- Rate-limit login, registration, password reset, posting, and voting endpoints.
- School access codes must be rotatable and must not be treated as proof of individual student identity.
- Password reset codes are one-time, short-lived, stored hashed, and audited.
- Teachers may initiate password resets only for students assigned to their class; administrators may assist any account.
- Keep student content behind authentication and prevent indexing.
- Log administrative actions without logging passwords, reset codes, or private ballot choices.

## Photo upload controls

- Accept only JPEG/JPG, PNG, and WebP images; reject videos and all other file types.
- Enforce a hard server-side limit of 2 MB per image. Client-side checks are only a convenience and never a security boundary.
- Verify file signatures/content and decode the image before accepting it; do not trust extensions or declared MIME types.
- Re-encode images into safe raster output and strip EXIF metadata, especially GPS coordinates.
- Generate non-guessable storage keys; never expose raw storage paths or credentials.
- Serve uploaded images only through authenticated, authorized access to the relevant content.
- Apply upload rate limits and safe image dimension/pixel limits to reduce abuse and decompression-bomb risk.
- Do not enable arbitrary file downloads or public bucket access.
