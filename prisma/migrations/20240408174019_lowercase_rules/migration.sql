-- Update first letter to be lowercase for Rule names
UPDATE public."Rule"
SET name = lower(left(name, 1)) || substring(name from 2)
WHERE name IS NOT NULL;