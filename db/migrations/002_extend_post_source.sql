-- Extend post_source enum with new adapter types: github releases, reddit posts.
-- Idempotent — re-running is a no-op once the values exist.

alter type post_source add value if not exists 'github';
alter type post_source add value if not exists 'reddit';
