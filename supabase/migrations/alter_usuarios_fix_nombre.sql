-- Make nombre nullable with a default so upserts without it don't fail
ALTER TABLE usuarios ALTER COLUMN nombre DROP NOT NULL;
ALTER TABLE usuarios ALTER COLUMN nombre SET DEFAULT '';
