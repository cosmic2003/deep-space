-- Extend post_source enum with Hacker News (Algolia search API stories).
alter type post_source add value if not exists 'hn';
