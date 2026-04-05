-- Rewrite image URLs from lqplake.org to local paths in writeup fields

UPDATE tournaments SET writeup = REPLACE(writeup, 'http://www.lqplake.org/uploads/1/8/0/2/18024505/', '/images/tournaments/') WHERE writeup LIKE '%lqplake.org%';
UPDATE fishing_league SET writeup = REPLACE(writeup, 'http://www.lqplake.org/uploads/1/8/0/2/18024505/', '/images/tournaments/') WHERE writeup LIKE '%lqplake.org%';

-- Move writeup content into the content field (merge the two)
UPDATE tournaments SET content = writeup WHERE writeup != '' AND (content = '{}' OR content = '');
UPDATE fishing_league SET content = writeup WHERE writeup != '' AND (content = '{}' OR content = '');
