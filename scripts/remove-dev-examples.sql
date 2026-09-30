-- Removes everything added by scripts/seed-dev-examples.sql.
--   npx wrangler d1 execute DB --remote --file scripts/remove-dev-examples.sql

DELETE FROM request_skills WHERE request_id LIKE 'e2000000-%';
DELETE FROM requests WHERE id LIKE 'e2000000-%';
DELETE FROM specialist_skills WHERE profile_id LIKE 'e1000000-%';
DELETE FROM specialist_profiles WHERE id LIKE 'e1000000-%';
DELETE FROM users WHERE id LIKE 'e0000000-%';
