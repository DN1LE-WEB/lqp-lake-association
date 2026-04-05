-- Pages
INSERT OR REPLACE INTO pages (slug, title, content) VALUES
  ('about', 'Our Mission', '{"type":"text","content":"To advocate the need for soil and water conservation in the watershed. To raise public awareness of environmental issues that have an impact on the lake and to generate response to promote the sport and recreational opportunities of the Lac Qui Parle Lake Area."}'),
  ('membership', 'LQPLA Membership', '{"type":"text","content":"Annual dues are $10.00. Send your check to: Lac Qui Parle Lake Association, PO Box 66, Montevideo, MN 56265. You can also download the membership application form from our website."}'),
  ('projects', 'Lake Association Projects', '{}'),
  ('tournament', 'Lac Qui Parle Walleye Tournament', '{}'),
  ('fishing-league', 'LQP Fishing League', '{}');

-- News
INSERT INTO news (title, content, image_url, sort_order) VALUES
  ('Lake Association Donation', '{"type":"text","content":"Lake Association recently donated $12,000 to Tri-County Let''s Go Fishing."}', '/images/original/lac-qui-parle-lake-walleye-tournament-2.png', 1),
  ('Fall 2015 Lac Qui Parle Lake Walleye Stocking!', '{"type":"text","content":"This Fall we stocked 7-9 inch walleyes in the lake! The fish were fin clipped (bottom left pectoral fin) so we can track our stocked fish. If you happen to catch a walleye with a clipped fin please email minnkotatackle@yahoo.com and let us know! Our goal was to stock 25,000 fish this fall. We will have an update on the exact numbers stocked soon."}', '/images/original/3320413067264908347_orig.jpg', 2);

-- Sections
INSERT OR REPLACE INTO sections (slug, title, content, visible, sort_order) VALUES
  ('welcome', 'Welcome to the LQP Lake Association', '{"type":"text","content":"Lac qui Parle Lake (also known as LQP Lake) is known for its walleye fishing in the spring and summer months and the waterfowl hunting in the fall. The Lac qui Parle Lake Association was formed in 1982 as a non-profit organization, and continues to promote the sport and recreational opportunities of the area. We work together with the Minnesota DNR to stock walleyes in Lac qui Parle Lake as well as promote conservation in the watershed.\n\nBoard Members: Scott Monson, Steve Mitlyng, Joe Bungarden, Pete McGinty, Andy Johnson, Brett Jacobs, Gary Groothius"}', 1, 1),
  ('projects-events', 'Projects & Events', '{}', 1, 2),
  ('stocking', 'Watch for Fin-Clipped Walleyes', '{"type":"text","content":"If you catch a walleye with a clipped bottom left pectoral fin, it was stocked through our program. Please email minnkotatackle@yahoo.com to report your catch!"}', 1, 3);

-- Settings
INSERT OR REPLACE INTO settings (key, value) VALUES
  ('site_name', 'Lac Qui Parle Lake Association'),
  ('contact_email', 'minnkotatackle@yahoo.com'),
  ('mailing_address', 'PO Box 66, Montevideo, MN 56265'),
  ('facebook_url', 'https://www.facebook.com/lqplakeassociation/'),
  ('admin_password_hash', 'changeme');

-- Tournaments (46th 2026 down to 33rd 2012)
INSERT INTO tournaments (title, year, annual_number, date, content) VALUES
  ('46th Annual Lac Qui Parle Walleye Tournament', 2026, '46th', '2026-06-06', '{}');
INSERT INTO tournaments (title, year, annual_number, content) VALUES
  ('45th Annual Lac Qui Parle Walleye Tournament', 2025, '45th', '{}'),
  ('44th Annual Lac Qui Parle Walleye Tournament', 2024, '44th', '{}'),
  ('43rd Annual Lac Qui Parle Walleye Tournament', 2023, '43rd', '{}'),
  ('42nd Annual Lac Qui Parle Walleye Tournament', 2022, '42nd', '{}'),
  ('41st Annual Lac Qui Parle Walleye Tournament', 2021, '41st', '{}'),
  ('41st Annual Lac Qui Parle Walleye Tournament', 2020, '41st', '{}'),
  ('40th Annual Lac Qui Parle Walleye Tournament', 2019, '40th', '{}'),
  ('39th Annual Lac Qui Parle Walleye Tournament', 2018, '39th', '{}'),
  ('38th Annual Lac Qui Parle Walleye Tournament', 2017, '38th', '{}'),
  ('37th Annual Lac Qui Parle Walleye Tournament', 2016, '37th', '{}'),
  ('36th Annual Lac Qui Parle Walleye Tournament', 2015, '36th', '{}'),
  ('35th Annual Lac Qui Parle Walleye Tournament', 2014, '35th', '{}'),
  ('34th Annual Lac Qui Parle Walleye Tournament', 2013, '34th', '{}'),
  ('33rd Annual Lac Qui Parle Walleye Tournament', 2012, '33rd', '{}');

-- Fishing League (2026 down to 2013)
INSERT INTO fishing_league (title, year, results_url, content) VALUES
  ('2026 LQP Fishing League', 2026, 'https://docs.google.com/spreadsheets/d/1EUozTvo7sJOHElyerPSpSfOPyTikDXBZgNaomz8-MhY/edit?gid=0#gid=0', '{}');
INSERT INTO fishing_league (title, year, content) VALUES
  ('2025 LQP Fishing League', 2025, '{}'),
  ('2024 LQP Fishing League', 2024, '{}'),
  ('2023 LQP Fishing League', 2023, '{}'),
  ('2022 LQP Fishing League', 2022, '{}'),
  ('2021 LQP Fishing League', 2021, '{}'),
  ('2020 LQP Fishing League', 2020, '{}'),
  ('2019 LQP Fishing League', 2019, '{}'),
  ('2018 LQP Fishing League', 2018, '{}'),
  ('2017 LQP Fishing League', 2017, '{}'),
  ('2016 LQP Fishing League', 2016, '{}'),
  ('2015 LQP Fishing League', 2015, '{}'),
  ('2014 LQP Fishing League', 2014, '{}'),
  ('2013 LQP Fishing League', 2013, '{}');

-- Gallery Albums
INSERT INTO gallery_albums (id, title, sort_order) VALUES
  (1, 'Walleye Stocking', 1),
  (2, 'Lake Fishing', 2),
  (3, 'Tournament & Events', 3);

-- Gallery Photos - Walleye Stocking (album 1)
INSERT INTO gallery_photos (album_id, url, sort_order) VALUES
  (1, '/images/original/7332574_orig.jpg', 1),
  (1, '/images/original/4432214_orig.jpg', 2),
  (1, '/images/original/2201075_orig.jpg', 3),
  (1, '/images/original/3946451_orig.jpg', 4),
  (1, '/images/original/3848027_orig.jpg', 5),
  (1, '/images/original/3320413067264908347_orig.jpg', 6);

-- Gallery Photos - Lake Fishing (album 2)
INSERT INTO gallery_photos (album_id, url, sort_order) VALUES
  (2, '/images/original/9830291_orig.jpg', 1),
  (2, '/images/original/9017893.jpg', 2),
  (2, '/images/original/3489574.jpg', 3),
  (2, '/images/original/8751468.jpg', 4),
  (2, '/images/original/8220424.jpg', 5),
  (2, '/images/original/5632435.jpg', 6),
  (2, '/images/original/3067261.jpg', 7),
  (2, '/images/original/2610052.jpg', 8);

-- Gallery Photos - Tournament & Events (album 3)
INSERT INTO gallery_photos (album_id, url, sort_order) VALUES
  (3, '/images/original/5212197.jpg', 1),
  (3, '/images/original/8077812.jpg', 2),
  (3, '/images/original/2162438.jpg', 3),
  (3, '/images/original/5531282.jpg', 4);
