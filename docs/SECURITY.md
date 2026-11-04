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
