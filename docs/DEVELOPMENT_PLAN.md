# Development plan

## Workflow
- `main`: stable branch. No changes without explicit user approval.
- `beta`: active implementation and testing.
- Deliver work in small milestones with a checklist and verification notes.
- GitHub Pages publishes only the static beta preview. The authenticated application will run on the beta app host with its API and database.
- No production deployment without explicit approval.

## Milestones
1. Project foundation, responsive shell, authentication and account model.
2. School access-code registration and secure session handling.
3. Profiles and profile customization.
4. School-wide feed, posts, media, comments and reactions.
5. Classes, class membership and class-specific feeds.
6. Roles, permissions, badges and admin panel.
7. Voting module and election integrity controls.
8. Student self-government, proposals and initiatives.
9. Events, announcements and calendar.
10. Notifications, moderation, audit log, backups and hardening.

## Current status
- [x] Public GitHub repository and separate `beta` branch.
- [x] Redesigned responsive SFERIO landing-page concept.
- [x] Initial API foundation: health, register, login, session lookup and logout routes.
- [x] Account model: username, password hash, chosen display name, default student role.
- [x] Password hashing, opaque server-side sessions, rate limits and server-side validation.
- [x] School access code is checked on the server using a deployment-only SHA-256 digest.
- [ ] Provision PostgreSQL and configure beta-only environment variables.
- [ ] Deploy API and verify registration/login end to end.
- [ ] Build the actual authenticated application shell and connect the sign-in/register screens.

## Current limitations
- The API code is in beta but is not live until PostgreSQL and private environment variables are configured.
- GitHub Pages is a static preview only and cannot host the API or database.
- Never commit real access codes, database credentials or student data.
