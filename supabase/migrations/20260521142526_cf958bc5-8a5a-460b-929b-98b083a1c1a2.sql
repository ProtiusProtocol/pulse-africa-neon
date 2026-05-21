
UPDATE market_suggestions SET created_market_id = NULL WHERE created_market_id = '526a29bb-d861-4095-996d-0387285d69be';
DELETE FROM markets WHERE id = '526a29bb-d861-4095-996d-0387285d69be';
UPDATE markets SET linked_signals = ARRAY['GEO-TRUMP-POPE-VALUES-CLASH'] WHERE id = 'ff4913c4-db77-4980-a22b-dd6c132cb0f1';
UPDATE markets SET linked_signals = ARRAY[]::text[] WHERE id = '4ee0718e-29c7-4a3b-8065-94d5ddfc1609';
DELETE FROM fragility_signals WHERE signal_code IN ('REL-POPE-TRUMP-DEBATE', 'POL-VATICAN-POPULIST-DIVERGENC');
