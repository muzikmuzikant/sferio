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
- First release: photos only, maximum 2 MB per original image.
- Up to 5 photos in one post.
- Accepted input formats: JPEG/JPG, PNG, WebP.
- No video uploads and no arbitrary file attachments.
- Server validates actual image content, rejects unsupported formats, limits decoding to 40 megapixels, applies orientation, resizes to at most 1920×1920, converts to WebP, and strips EXIF metadata.
- Each optimized image is stored in PostgreSQL and delivered only through an authenticated route.
- The upload limit is enforced on the server as well as in the interface.

## Current status
- [x] Public GitHub repository and separate `beta` branch.
- [x] Responsive SFERIO landing page and authentication interface.
- [x] Authentication API: health, register, login, session lookup and logout.
- [x] Argon2id password hashing, opaque server-side sessions, rate limits, no-cache API responses and server-side validation.
- [x] Private school access-code verification using an Argon2id hash.
- [x] PostgreSQL provisioned in Railway project SFERIO, environment `beta`.
- [x] Beta app service configured with a private database connection reference, PostgreSQL SSL, Node API start command and `/api/health` health check.
- [x] School-wide feed API for text posts, comments and reactions.
- [x] Content report submission API and audit-log foundation.
- [x] Photo-only upload and private delivery API: 2 MB per image, up to 5 images per post, safe WebP processing.
- [x] Multiple-role schema, seeded system roles, scoped class roles and server-side permission checks.
- [x] Class listing, private class detail, admin class creation and class membership/leadership assignment APIs.
- [x] One-time admin bootstrap endpoint protected by a private Railway environment secret.
- [x] Member feed UI connected to posts, comments, reactions and photo uploads.
- [x] Server JavaScript syntax check added to the build pipeline.
- [ ] Complete the latest beta deployment and verify database/API health.
- [x] Configure a private Argon2id school access-code hash in Railway beta (the actual code is not stored in GitHub).
- [ ] Claim the initial administrator account after creating its user account using the one-time private bootstrap token.
- [ ] Verify registration, sign-in, feed, class permissions and photo upload end to end.
- [ ] Build profile pages and profile settings.
- [ ] Build class pages and admin/moderation interfaces.
- [ ] Implement teacher/admin password recovery.
- [ ] Implement voting, self-government, events, announcements and notifications.

## Current limitations
- Registration remains unavailable until a real school access-code hash is configured privately in the beta environment.
- The authenticated app and core feed are implemented in source, but the latest server deployment still needs a successful health check.
- Class APIs exist; class pages and admin management screens are not yet complete.
- Password recovery and voting are not yet implemented.
- GitHub Pages is a static preview only and cannot host the API or database.
- Never commit real access codes, bootstrap tokens, database credentials or student data.
