-- Create admin@pani.com profile
-- BEFORE running this:
--   1. Go to Supabase Dashboard → Authentication → Users → Add user
--   2. Email: admin@pani.com, set a strong password
--   3. Copy the UUID shown for that user and replace <UUID_FROM_AUTH> below

INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  '<UUID_FROM_AUTH>',
  'admin@pani.com',
  'Platform Admin',
  'admin'
)
ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      email = 'admin@pani.com',
      full_name = COALESCE(profiles.full_name, 'Platform Admin');
