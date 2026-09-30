-- Example Requests and specialists for the dev environment, so pages have content to look at.
--   npx wrangler d1 execute DB --remote --file scripts/seed-dev-examples.sql
-- Every row uses an id starting with "e0" so it can be removed later with scripts/remove-dev-examples.sql.
-- Never run against production.

INSERT OR IGNORE INTO users (id, clerk_id, email, display_name) VALUES
  ('e0000000-0000-4000-8000-000000000001', 'example_requester_1', 'sam.example@example.com', 'Sam Porter'),
  ('e0000000-0000-4000-8000-000000000002', 'example_requester_2', 'priya.example@example.com', 'Priya Shah'),
  ('e0000000-0000-4000-8000-000000000003', 'example_requester_3', 'daniel.example@example.com', 'Daniel Reyes'),
  ('e0000000-0000-4000-8000-000000000011', 'example_specialist_1', 'maya.example@example.com', 'Maya Chen'),
  ('e0000000-0000-4000-8000-000000000012', 'example_specialist_2', 'tom.example@example.com', 'Tom Okafor'),
  ('e0000000-0000-4000-8000-000000000013', 'example_specialist_3', 'lena.example@example.com', 'Lena Fischer');

INSERT OR IGNORE INTO specialist_profiles (id, user_id, slug, name, title, positioning, about, helps_with, location, status) VALUES
  ('e1000000-0000-4000-8000-000000000011', 'e0000000-0000-4000-8000-000000000011', 'maya-chen-example', 'Maya Chen', 'Product designer',
   'I turn AI-generated websites and apps into polished products.',
   'Ten years designing web products for startups and agencies. Lately most of my work starts from something a founder built with Claude, Lovable or v0.',
   'Visual redesigns of AI-built sites, UX clean-up, design systems for prototypes.', 'London, UK', 'published'),
  ('e1000000-0000-4000-8000-000000000012', 'e0000000-0000-4000-8000-000000000012', 'tom-okafor-example', 'Tom Okafor', 'Full-stack developer',
   'I make AI-built apps production-ready: auth, data, performance and deployment.',
   'Next.js, Postgres and Cloudflare. I review AI-generated code and fix what will break once real people use it.',
   'Code review, security fixes, getting prototypes deployed properly.', 'Lagos, Nigeria', 'published'),
  ('e1000000-0000-4000-8000-000000000013', 'e0000000-0000-4000-8000-000000000013', 'lena-fischer-example', 'Lena Fischer', 'QA & accessibility specialist',
   'I find what your AI-built app gets wrong before your customers do.',
   'Manual and automated testing, WCAG audits and cross-device checks.',
   'Testing AI-built apps on real devices, accessibility fixes, launch checklists.', 'Berlin, Germany', 'published');

INSERT OR IGNORE INTO specialist_skills (profile_id, skill_id)
  SELECT 'e1000000-0000-4000-8000-000000000011', id FROM skills WHERE slug IN ('ui-ux-design', 'web-design', 'product-design', 'branding');
INSERT OR IGNORE INTO specialist_skills (profile_id, skill_id)
  SELECT 'e1000000-0000-4000-8000-000000000012', id FROM skills WHERE slug IN ('full-stack-development', 'code-review', 'security-review', 'devops-deployment');
INSERT OR IGNORE INTO specialist_skills (profile_id, skill_id)
  SELECT 'e1000000-0000-4000-8000-000000000013', id FROM skills WHERE slug IN ('qa-testing', 'accessibility', 'performance');

INSERT OR IGNORE INTO requests (id, user_id, slug, title, ai_created, likes, not_right, needs, problem_tags, url, budget, status, published_at) VALUES
  ('e2000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'make-my-clinic-website-look-professional-ex01',
   'Make my AI-generated clinic website look professional',
   'A website for my physiotherapy clinic, built with Claude. The booking system and the basic pages all work.',
   'The functionality works well and the page structure is mostly right.',
   'The design feels generic and looks like an AI template. On mobile the booking form is awkward to fill in.',
   'Someone to improve the visual design and UX without rebuilding the underlying functionality.',
   '["It looks generic","The UX needs improving"]', 'https://example.com', '£500–£1,000', 'published', (unixepoch() * 1000) - 2 * 3600000),
  ('e2000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000002', 'review-my-lovable-app-before-launch-ex02',
   'Review my Lovable app before I launch it',
   'A small SaaS for booking dog walks, built with Lovable and Supabase. Customers can sign up, book and pay.',
   'It does everything I wanted and my test users like it.',
   'I have no idea whether it is secure, and a couple of pages are slow to load.',
   'An experienced developer to look over the code, fix anything risky and tell me what else to worry about.',
   '["I want an expert opinion","I don''t know what''s wrong"]', NULL, NULL, 'published', (unixepoch() * 1000) - 9 * 3600000),
  ('e2000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000003', 'finish-my-v0-recipe-app-ex03',
   'Finish my v0 prototype for a recipe app',
   'A recipe-sharing app prototype built with v0. You can browse and search recipes.',
   'The look is nice and browsing feels quick.',
   'Saving recipes and user accounts are missing entirely, so it is only a demo right now.',
   'Someone to add accounts and saved recipes, then get it deployed properly.',
   '["Something is missing","I need someone to finish it"]', NULL, '£1,500', 'published', (unixepoch() * 1000) - 26 * 3600000),
  ('e2000000-0000-4000-8000-000000000004', 'e0000000-0000-4000-8000-000000000002', 'bakery-shop-feels-off-ex04',
   'My bakery''s online shop works, but something feels off',
   'An online shop for my bakery made with ChatGPT and Shopify. Products, basket and checkout all work.',
   'The product photos and the menu layout.',
   'People visit but hardly anyone orders. I can''t tell if it''s the design, the wording or something else.',
   'An honest opinion from someone who knows what makes a shop feel trustworthy, and help fixing it.',
   '["I don''t know what''s wrong","I want it to feel more professional"]', 'https://example.com', 'Open to suggestions', 'published', (unixepoch() * 1000) - 3 * 86400000),
  ('e2000000-0000-4000-8000-000000000005', 'e0000000-0000-4000-8000-000000000003', 'cursor-app-breaks-on-mobile-ex05',
   'Cursor-built booking app breaks on mobile',
   'A class-booking app for my yoga studio, written mostly with Cursor. Works fine on my laptop.',
   '',
   'On phones the timetable overflows, buttons are hard to tap and the calendar sometimes shows the wrong day.',
   'A front-end developer to make it work properly on phones and fix the date bug.',
   '["It doesn''t work properly","The UX needs improving"]', NULL, '£300–£600', 'published', (unixepoch() * 1000) - 5 * 86400000),
  ('e2000000-0000-4000-8000-000000000006', 'e0000000-0000-4000-8000-000000000001', 'portfolio-site-copy-and-polish-ex06',
   'Polish the wording and details on my Bolt portfolio site',
   'A portfolio site for my architecture practice, built with Bolt.',
   'The layout and image galleries.',
   'The text reads like AI wrote it, and small details such as spacing and fonts are inconsistent.',
   'Someone to rewrite the copy in a more human voice and tidy up the visual details.',
   '["I want it to feel more professional"]', 'https://example.com', '£400', 'published', (unixepoch() * 1000) - 8 * 86400000);

INSERT OR IGNORE INTO request_skills (request_id, skill_id)
  SELECT 'e2000000-0000-4000-8000-000000000001', id FROM skills WHERE slug IN ('ui-ux-design', 'web-design');
INSERT OR IGNORE INTO request_skills (request_id, skill_id)
  SELECT 'e2000000-0000-4000-8000-000000000002', id FROM skills WHERE slug IN ('code-review', 'security-review', 'performance');
INSERT OR IGNORE INTO request_skills (request_id, skill_id)
  SELECT 'e2000000-0000-4000-8000-000000000003', id FROM skills WHERE slug IN ('full-stack-development', 'devops-deployment');
INSERT OR IGNORE INTO request_skills (request_id, skill_id)
  SELECT 'e2000000-0000-4000-8000-000000000004', id FROM skills WHERE slug IN ('web-design', 'copywriting');
INSERT OR IGNORE INTO request_skills (request_id, skill_id)
  SELECT 'e2000000-0000-4000-8000-000000000005', id FROM skills WHERE slug IN ('frontend-development', 'mobile-development', 'qa-testing');
INSERT OR IGNORE INTO request_skills (request_id, skill_id)
  SELECT 'e2000000-0000-4000-8000-000000000006', id FROM skills WHERE slug IN ('copywriting', 'editing', 'web-design');
