-- The app connects as `app_user`, which row-level security applies to.
-- Migrations and the seed run as the owner (`deepdev`), and the platform Console
-- uses the owner connection too, so it can see every school.
CREATE ROLE app_user LOGIN PASSWORD 'app_user';
GRANT CONNECT ON DATABASE deepdev TO app_user;
CREATE DATABASE deepdev_test OWNER deepdev;
GRANT CONNECT ON DATABASE deepdev_test TO app_user;
