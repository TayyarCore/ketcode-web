# Ketcode portal Auth in Preview

Use the dedicated Ketcode Supabase project. Configure the four `FACTORY_*` values in `.env.example` on the Preview deployment. Both keys must belong to the project named in `FACTORY_SUPABASE_URL`. The database secret stays server-side.

In Supabase Auth, enable the email provider, new user signups and email confirmation. Configure the Magic Link template to show the one-time code using `{{ .Token }}`. Use the project's SMTP configuration to deliver codes to test customers. Set `FACTORY_ENABLED=true` after confirming email delivery and that the existing portal schema is available in that project.

The portal checks the signed-in user's verified email on every project request and write. Existing projects can be opened with their existing recovery code and the email stored on the project. New projects use the verified email automatically. The Auth cookie lasts up to one hour. After expiry, sign in again with a new code.

Verify on Preview:

1. Visit `/portal` while signed out and confirm it redirects to `/portal/login`.
2. Sign in by email code, register a project, save materials and confirm they persist.
3. Sign out and confirm the browser is redirected to login. Sign in again with the original email and open the project with its recovery code.
4. Sign in with a second email and confirm the first project's recovery code cannot open it or authorize an update.
5. Confirm `/portal?demo=1` displays sample data only on Preview.
