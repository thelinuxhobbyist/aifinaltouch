-- Sample content for local development only:
--   pnpm wrangler d1 execute DB --local --file scripts/seed-local.sql
-- Never run against a remote database.

INSERT OR IGNORE INTO users (id, clerk_id, email, display_name) VALUES
  ('00000000-0000-4000-8000-000000000001', 'seed_requester', 'sam@example.com', 'Sam Porter'),
  ('00000000-0000-4000-8000-000000000002', 'seed_designer', 'maya@example.com', 'Maya Chen'),
  ('00000000-0000-4000-8000-000000000003', 'seed_developer', 'tom@example.com', 'Tom Okafor'),
  ('00000000-0000-4000-8000-000000000004', 'seed_qa', 'lena@example.com', 'Lena Fischer');

INSERT OR IGNORE INTO specialist_profiles (id, user_id, slug, name, title, positioning, about, helps_with, location, work_mode, website_url, status) VALUES
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'maya-chen', 'Maya Chen', 'Product designer',
   'I turn AI-generated websites and apps into polished products.',
   'Ten years designing web products for startups and agencies. Lately most of my work starts from something a founder built with Claude, Lovable or v0.',
   'Visual redesigns of AI-built sites, UX clean-up, design systems for prototypes.', 'London, UK', 'remote', 'https://example.com', 'published'),
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000003', 'tom-okafor', 'Tom Okafor', 'Full-stack developer',
   'I make AI-built apps production-ready: auth, data, performance and deployment.',
   'Next.js, Postgres and Cloudflare. I review AI-generated code and fix what will break at scale.',
   'Code review, security fixes, getting prototypes deployed properly.', 'Lagos, Nigeria', 'remote', NULL, 'published'),
  ('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000004', 'lena-fischer', 'Lena Fischer', 'QA & accessibility specialist',
   'I find what your AI-built app gets wrong before your customers do.',
   'Manual and automated testing, WCAG audits, cross-device checks.', '', 'Berlin, Germany', 'hybrid', NULL, 'published');

INSERT OR IGNORE INTO specialist_skills (profile_id, skill_id)
  SELECT '10000000-0000-4000-8000-000000000002', id FROM skills WHERE slug IN ('ui-ux-design', 'web-design', 'product-design', 'branding');
INSERT OR IGNORE INTO specialist_skills (profile_id, skill_id)
  SELECT '10000000-0000-4000-8000-000000000003', id FROM skills WHERE slug IN ('full-stack-development', 'code-review', 'security-review', 'devops-deployment');
INSERT OR IGNORE INTO specialist_skills (profile_id, skill_id)
  SELECT '10000000-0000-4000-8000-000000000004', id FROM skills WHERE slug IN ('qa-testing', 'accessibility', 'performance');

INSERT OR IGNORE INTO requests (id, user_id, slug, title, ai_created, likes, not_right, needs, problem_tags, url, budget, remote_preference, status, published_at) VALUES
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'make-my-ai-generated-website-look-professional-seed01',
   'Make my AI-generated website look professional',
   'Website for my physiotherapy clinic, built using Claude. The booking system and basic pages are working.',
   'The functionality works well and the structure is mostly right.',
   'The design feels generic and looks like an AI-generated template. On mobile the booking form is awkward.',
   'Someone to improve the visual design and UX without rebuilding the underlying functionality.',
   '["It looks generic","The UX needs improving"]', 'https://example.com', '£500–£1,000', 'remote', 'published', (unixepoch() * 1000) - 3600000),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'review-my-lovable-app-before-launch-seed02',
   'Review my Lovable app before launch',
   'A small SaaS for tracking dog-walking bookings, built with Lovable and Supabase.',
   '', 'I have no idea if it is secure. Some pages are slow.',
   'An experienced developer to review the code, fix anything risky and tell me what else to worry about.',
   '["I want an expert opinion"]', NULL, NULL, 'either', 'published', (unixepoch() * 1000) - 86400000),
  ('20000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', 'finish-my-v0-prototype-seed03',
   'Finish my v0 prototype for a recipe app',
   'A recipe-sharing app prototype built with v0. Browsing works.',
   'The look is nice.', 'Saving recipes and user accounts are missing entirely.',
   'Someone to add accounts and saving, then deploy it.', '["Something is missing","I need someone to finish it"]', NULL, '£1,500', 'remote', 'published', (unixepoch() * 1000) - 172800000);

INSERT OR IGNORE INTO request_skills (request_id, skill_id)
  SELECT '20000000-0000-4000-8000-000000000001', id FROM skills WHERE slug IN ('ui-ux-design', 'web-design');
INSERT OR IGNORE INTO request_skills (request_id, skill_id)
  SELECT '20000000-0000-4000-8000-000000000002', id FROM skills WHERE slug IN ('code-review', 'security-review');
INSERT OR IGNORE INTO request_skills (request_id, skill_id)
  SELECT '20000000-0000-4000-8000-000000000003', id FROM skills WHERE slug IN ('full-stack-development');

INSERT OR IGNORE INTO interests (id, request_id, specialist_user_id, profile_id, message) VALUES
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002',
   'I''ve worked on several AI-generated sites and can help improve the visual design, layout and UX.');

INSERT OR IGNORE INTO conversations (id, request_id, interest_id, requester_user_id, specialist_user_id) VALUES
  ('40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002');

INSERT OR IGNORE INTO messages (id, conversation_id, sender_user_id, body) VALUES
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002',
   'I''ve worked on several AI-generated sites and can help improve the visual design, layout and UX.');
