-- V10: Sync all primary key sequences to avoid duplicate key errors after manual seed insertions
SELECT setval('users_id_seq', (SELECT GREATEST(COALESCE(MAX(id), 0) + 1, 100) FROM users), false);
SELECT setval('chat_rooms_id_seq', (SELECT GREATEST(COALESCE(MAX(id), 0) + 1, 100) FROM chat_rooms), false);
SELECT setval('messages_id_seq', (SELECT GREATEST(COALESCE(MAX(id), 0) + 1, 100) FROM messages), false);
SELECT setval('reports_id_seq', (SELECT GREATEST(COALESCE(MAX(id), 0) + 1, 100) FROM reports), false);
SELECT setval('listings_id_seq', (SELECT GREATEST(COALESCE(MAX(id), 0) + 1, 100) FROM listings), false);
SELECT setval('rental_contracts_id_seq', (SELECT GREATEST(COALESCE(MAX(id), 0) + 1, 100) FROM rental_contracts), false);
SELECT setval('swap_proposals_id_seq', (SELECT GREATEST(COALESCE(MAX(id), 0) + 1, 100) FROM swap_proposals), false);
