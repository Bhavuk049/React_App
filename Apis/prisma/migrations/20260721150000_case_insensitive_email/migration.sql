-- Normalize any existing emails to lowercase (belt-and-suspenders; app now always lowercases).
UPDATE "users" SET "email" = lower("email");

-- Enforce case-insensitive uniqueness at the database level too, so this can't regress
-- even if some future code path forgets to normalize the email before writing it.
CREATE UNIQUE INDEX "users_email_lower_key" ON "users" (lower("email"));
