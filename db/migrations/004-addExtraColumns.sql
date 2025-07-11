--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

ALTER TABLE story ADD COLUMN language TEXT NOT NULL DEFAULT 'English';
ALTER TABLE character ADD COLUMN crossover INTEGER NOT NULL DEFAULT 0;

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

ALTER TABLE story DROP COLUMN language;
ALTER TABLE character DROP COLUMN crossover;