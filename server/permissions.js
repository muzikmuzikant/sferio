export async function userHasPermission(pool, userId, permission, classId = null) {
  const result = await pool.query(
    "SELECT EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = $1 AND (ur.class_id IS NULL OR ($3::uuid IS NOT NULL AND ur.class_id = $3::uuid)) AND (r.permissions @> $2::jsonb OR r.permissions @> '[\"*\"]'::jsonb)) AS allowed",
    [userId, JSON.stringify([permission]), classId]
  )
  return result.rows[0]?.allowed === true
}
