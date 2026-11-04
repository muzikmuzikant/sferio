# Development plan

## Workflow
- `main`: stable branch. No changes without explicit user approval.
- `beta`: active implementation and testing.
- Deliver work in small milestones with a checklist and verification notes.
- GitHub Pages publishes only the static beta preview. The authenticated application runs on the beta app host with its API and database.
- No production deployment without explicit approval.

## Milestones
1. Project foundation, responsive shell, authentication and account model.
2. School access-code registration and secure session handling.
3. Profiles and profile customization.
4. School-wide feed, photo-only posts, comments and reactions.
5. Classes, class membership and class-specific feeds.
6. Roles, permissions, badges and admin panel.
7. Voting module and election integrity controls.
8. Student self-government, proposals and initiatives.
9. Events, announcements and calendar.
10. Notifications, moderation, audit log, backups and hardening.

## Media requirements
- First release: photos only, maximum 2 MB per image.
- Accepted formats: JPEG/JPG, PNG, WebP.
- No video uploads and no arbitrary file attachments.
- Implement server-side file signature validation, safe image decoding/re-encoding, EXIF removal, dimension limits, authenticated access, and upload rate limits.
- The media feature is a product requirement, not yet implemented.

## Current status
- [x] Public GitHub repository and separate `beta` branch.
- [x] Redesigned responsive SFERIO landing-page concept.
- [x] Initial API foundation: health, register, login, session lookup and logout routes.
- [x] Account model: username, password hash, chosen display name, default student role.
- [x] Argon2id password hashing, opaque server-side sessions, rate limits and server-side validation.
- [x] School access code is checked on the server using a deployment-only Argon2id hash.
- [x] PostgreSQL provisioned in Railway project SFERIO, environment `beta`.
- [x] Beta app service configured with a private database connection reference and PostgreSQL SSL mode.
- [ ] Complete and verify the current beta API deployment.
- [ ] Configure the school access-code hash in beta environment variables.
- [ ] Verify registration/login end to end against PostgreSQL.
- [ ] Build the actual authenticated application shell and connect the sign-in/register screens.
- [ ] Implement photo-only uploads under the defined 2 MB policy.

## Current limitations
- The authenticated app and photo upload flow are not yet complete.
- GitHub Pages is a static preview only and cannot host the API or database.
- Never commit real access codes, database credentials or student data.
