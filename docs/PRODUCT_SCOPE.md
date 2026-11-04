# SFERIO — product scope

School: Слобідський ліцей №2  
Audience: one school community only.

## Core principles

- This is a private school social network, not an e-diary or learning-management system.
- No grades, timetable, homework, friend graph, following, or private messages.
- Self-registration requires a school access code.
- Signup collects username, password, and a chosen display name; no mandatory real name, phone, email, address, or birth date.
- Classes are created by administrators. Students request class setup through support.
- Class teachers manage class leadership assignments within their own class.
- Users may have multiple permission roles. Decorative badges never grant permissions.
- Authorization is enforced on the server, not only by hiding interface controls.

## Planned modules

1. Accounts, authentication, school access code, password recovery through class teacher/admin.
2. Profiles and customization.
3. School-wide feed, posts, media, comments, reactions, reports, moderation.
4. Class pages and class feeds.
5. Roles, permissions, badges, and admin panel.
6. Large-scale voting, including secret ballots for sensitive elections.
7. Student self-government, initiatives, and proposals.
8. Events and announcements.
9. In-app and push notifications.
10. Audit log, backups, privacy controls, and operational monitoring.

## Voting integrity

An access code alone does not prove that one account equals one real student. Fun polls may use one vote per account. Official elections need an administrator-maintained eligibility list or equivalent school-side verification. Secret ballots must not expose individual choices to ordinary users or administrators.

## Safety and privacy

- Profiles and content are available only to authenticated members.
- No public student directory or search-engine indexing of member content.
- Provide reporting, blocking, and active moderation.
- Do not collect unnecessary personal data.
- Establish clear rules for photos/videos showing students.
- Keep secrets and student data out of the public source repository.
