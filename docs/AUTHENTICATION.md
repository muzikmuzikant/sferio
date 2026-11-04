# SFERIO authentication foundation

## Account fields
- Username (unique, 3–24 characters; letters, digits, underscore, dot, hyphen)
- Password (10–128 characters; Argon2id hash)
- Chosen display name (2–40 characters)
- School access code (checked server-side; never stored on the account)

No real name, phone number, email, address or date of birth is required.

## User interface
- Sign-in and registration tabs are available from the landing page.
- Registration asks for username, chosen display name, password and school access code.
- Sign-in asks only for username and password.
- The interface includes password visibility toggle, field validation, loading state and Ukrainian error messages.
- After successful authentication, the user sees the initial member-only workspace.
- The member workspace is a foundation screen; feed, profiles, classes and other modules are planned next.
- Password recovery is not yet implemented. The documented recovery flow will use the user's class teacher or an administrator.

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
- Login and registration are rate-limited. Limits account for students sharing a school network.
- API responses are marked no-store to prevent caching of private account data.
- User input is validated on the server.
- School access code is verified against an Argon2id hash stored in the `SCHOOL_ACCESS_CODE_HASH` deployment variable.
- Do not commit the actual access code, database URL or any credentials.

## Deployment requirements
Set `DATABASE_URL` and `SCHOOL_ACCESS_CODE_HASH` in the beta service's private environment variables. The app and API should be served from the same origin so browser sessions are not dependent on third-party cookies.
