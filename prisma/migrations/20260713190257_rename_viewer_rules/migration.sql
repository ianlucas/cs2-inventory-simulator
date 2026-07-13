-- Rename viewer rules to the top-level `viewer*` domain. Overrides in
-- "UserRule"/"GroupRule" follow via ON UPDATE CASCADE. If the app booted with
-- the new names before migrating, `register()` has already inserted fresh
-- default rows under them; drop those so the old rows (the operator's actual
-- values and overrides) win the rename.
DELETE FROM "Rule" WHERE name = 'viewerEnabled' AND EXISTS (SELECT 1 FROM "Rule" WHERE name = 'appEnable3dViewer');
UPDATE "Rule" SET name = 'viewerEnabled' WHERE name = 'appEnable3dViewer';
DELETE FROM "Rule" WHERE name = 'viewerKey' AND EXISTS (SELECT 1 FROM "Rule" WHERE name = 'app3dViewerKey');
UPDATE "Rule" SET name = 'viewerKey' WHERE name = 'app3dViewerKey';
