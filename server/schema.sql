CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(24) NOT NULL,
  username_normalized VARCHAR(24) NOT NULL UNIQUE,
  display_name VARCHAR(40) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(24) NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

-- Private profile data: only fields intended to be visible inside SFERIO.
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio VARCHAR(240) NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Classes are created by administrators; students cannot create them directly.
CREATE TABLE IF NOT EXISTS school_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(12) NOT NULL UNIQUE,
  grade SMALLINT NOT NULL CHECK (grade BETWEEN 1 AND 11),
  section VARCHAR(3) NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS class_memberships (
  class_id UUID NOT NULL REFERENCES school_classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_role VARCHAR(20) NOT NULL DEFAULT 'student'
    CHECK (class_role IN ('student', 'class_teacher', 'starosta', 'deputy')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (class_id, user_id)
);

CREATE INDEX IF NOT EXISTS class_memberships_user_idx ON class_memberships(user_id);

-- A null class_id means a school-wide post; otherwise it belongs to one class.
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  class_id UUID REFERENCES school_classes(id) ON DELETE CASCADE,
  body TEXT NOT NULL DEFAULT '' CHECK (char_length(body) <= 5000),
  status VARCHAR(16) NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'hidden', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS posts_school_feed_idx
  ON posts(created_at DESC) WHERE class_id IS NULL AND status = 'published';
CREATE INDEX IF NOT EXISTS posts_class_feed_idx
  ON posts(class_id, created_at DESC) WHERE class_id IS NOT NULL AND status = 'published';
CREATE INDEX IF NOT EXISTS posts_author_idx ON posts(author_id, created_at DESC);

-- Photo-only media policy: 2 MiB per image, no videos or arbitrary files.
CREATE TABLE IF NOT EXISTS post_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  storage_key TEXT UNIQUE,
  image_data BYTEA,
  mime_type VARCHAR(32) NOT NULL
    CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes BETWEEN 1 AND 2097152),
  width INTEGER NOT NULL CHECK (width BETWEEN 1 AND 8000),
  height INTEGER NOT NULL CHECK (height BETWEEN 1 AND 8000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE post_photos ALTER COLUMN storage_key DROP NOT NULL;
ALTER TABLE post_photos ADD COLUMN IF NOT EXISTS image_data BYTEA;

CREATE INDEX IF NOT EXISTS post_photos_post_idx ON post_photos(post_id);

CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  body VARCHAR(1500) NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1500),
  status VARCHAR(16) NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'hidden', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS post_comments_feed_idx
  ON post_comments(post_id, created_at ASC) WHERE status = 'published';

CREATE TABLE IF NOT EXISTS post_reactions (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction VARCHAR(16) NOT NULL
    CHECK (reaction IN ('like', 'heart', 'support', 'laugh', 'idea')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  reason VARCHAR(32) NOT NULL
    CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'privacy', 'other')),
  details VARCHAR(500) NOT NULL DEFAULT '',
  status VARCHAR(16) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (num_nonnulls(post_id, comment_id) = 1)
);

CREATE INDEX IF NOT EXISTS content_reports_queue_idx
  ON content_reports(status, created_at ASC);

-- Permission roles support multiple global and class-scoped roles per account.
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(32) NOT NULL UNIQUE,
  title VARCHAR(50) NOT NULL,
  icon VARCHAR(32) NOT NULL DEFAULT 'shield',
  color VARCHAR(16) NOT NULL DEFAULT '#8B7CE6',
  description VARCHAR(200) NOT NULL DEFAULT '',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (slug, title, icon, color, description, is_system, permissions) VALUES
  ('admin', 'Адміністратор', 'shield-check', '#A78BFA', 'Повний доступ до керування SFERIO', TRUE, '["*"]'::jsonb),
  ('president', 'Президент учнівського самоврядування', 'award', '#E6B85C', 'Координація учнівського самоврядування', TRUE, '["voting.manage","initiatives.manage","events.manage"]'::jsonb),
  ('teacher', 'Вчитель', 'graduation-cap', '#65A6D9', 'Працівник ліцею', TRUE, '["announcements.create"]'::jsonb),
  ('class_teacher', 'Класний керівник', 'users', '#65B89B', 'Керування власним класом', TRUE, '["class.members.manage","class.leadership.manage","class.posts.moderate"]'::jsonb),
  ('starosta', 'Староста', 'crown', '#D6A65D', 'Представник класу', TRUE, '["class.events.create"]'::jsonb),
  ('deputy', 'Заступник старости', 'badge-check', '#B39AE6', 'Заступник представника класу', TRUE, '["class.events.create"]'::jsonb),
  ('moderator', 'Модератор', 'eye', '#D58E9B', 'Модерація шкільного контенту', TRUE, '["content.moderate","content.reports.manage"]'::jsonb),
  ('student', 'Учень', 'user-round', '#8B7CE6', 'Стандартний обліковий запис', TRUE, '["posts.create","comments.create","reactions.create","reports.create"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES school_classes(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_global_unique
  ON user_roles(user_id, role_id) WHERE class_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_class_unique
  ON user_roles(user_id, role_id, class_id) WHERE class_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS user_roles_user_idx ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS user_roles_class_idx ON user_roles(class_id) WHERE class_id IS NOT NULL;

-- Backfill role assignments for accounts created before the role system migration.
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.slug = COALESCE(u.role, 'student')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(80) NOT NULL,
  target_type VARCHAR(40) NOT NULL,
  target_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON audit_log(actor_id, created_at DESC);
