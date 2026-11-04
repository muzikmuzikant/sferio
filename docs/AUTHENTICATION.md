# SFERIO authentication foundation

## Account fields
- Username (unique, 3–24 characters; letters, digits, underscore, dot, hyphen)
- Password (10–128 characters; Argon2id-compatible hash)
- Chosen display name (2–40 characters)
- School access code (checked server-side; never stored on the account)

No real name, phone number, email, address or date of birth is required.

## API
- `GET /api/health` — service and database health
- `POST /api/auth/register` — create account and session
- `POST /api/auth/login` — sign in
- `GET /api/auth/me` — current session
- `POST /api/auth/logout` — revoke current session

## Security
- Passwords are hashed with Argon2id.
- Session tokens are random, opaque, and stored only as SHA-256 hashes.
- Session cookie is HttpOnly, SameSite=Lax and Secure in production.
- Login and registration are rate-limited.
- User input is validated on the server.
- School access code is verified against an Argon2id hash stored in a deployment variable.
- Do not commit the actual access code, database URL or any credentials.

## Deployment requirements
Set `DATABASE_URL` and `SCHOOL_ACCESS_CODE_SHA256` in the beta service's private environment variables. The app and API should be served from the same origin so browser sessions are not dependent on third-party cookies.
