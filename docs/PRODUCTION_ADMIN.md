# Production commercial portfolio and admin

## Configuration and rollout

1. Use Railway's `backend/` root. Keep MySQL on private networking and verify the `production` profile, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` and the backend-only `CLOUDINARY_*` variables. Railway currently lists no public domain for the backend. With separate approval, assign an HTTPS domain to the **backend service**. Use its bare origin as `RAILWAY_BACKEND_ORIGIN` in Vercel. The current site redirects the apex to `https://www.marinarodriiphoto.com`; verify cookies and links at the final serving origin.
2. Before starting the new backend, apply Flyway V4 through the approved release migration step. The current deployment has no configured pre-deploy command. Use the new release JAR, the verified private database and production profile, and scope Flyway to this one non-web process:

   ```sh
   java -jar target/backend-0.0.1-SNAPSHOT.jar \
     --spring.main.web-application-type=none \
     --spring.flyway.enabled=true --spring.flyway.target=4
   ```

   Confirm Flyway V1–V4 succeeded, the 89 published photos are still present, and the account table is in the expected state. Leave Flyway disabled for the regular server. V4 adds a password-change flag and credential version. Existing accounts keep their current passwords.
3. Use Vercel's `frontend/` project root and the programmatic `vercel.js` configuration. The rewrites proxy only admin API, public commercial portfolio and public portfolio media routes. Keep credentials in Railway. On the test deployment set `VITE_ADMIN_ENABLED=true` and leave `VITE_PUBLIC_PORTFOLIO_API=false`. Use an isolated backend for preview mutations and uploads. Keep both flags unset or false on other deployments unless explicitly needed.
4. Verify the real HTTPS preview proxy before live activation. Check that the login cookie is host-only, Secure, HttpOnly, SameSite=Lax and scoped to `/`; login rotates the ID; logout clears it; idle expiry works; and no admin or API responses are shared by the CDN. Check that CSRF headers, JSON and multipart bodies, and API status codes survive the rewrites. Confirm pending users can only see the password-change screen and cannot list, upload, edit or reorder photos by API. Test publishing, hiding, ordering and media delivery with non-production data.
5. Provision the two production accounts in the approved human-operated session. Enable the admin switch in production once verified. Verify Lorena's sign-in, Marina's password change and sign-in, and both accounts' logout. Then verify the read-only production feed and image URLs for all 89 photographs before enabling `VITE_PUBLIC_PORTFOLIO_API=true` in a separate release. Rebuilding with that flag off restores the bundled gallery. The gallery reports an API failure when the flag is on so an outage cannot silently show unpublished or stale edits from the static catalogue.

## First-time provisioning

Run this yourself in a non-recorded interactive terminal, using the known Railway SSH host key and the verified production backend. Replace the destination placeholder with the linked backend service's current Railway SSH destination.

```sh
ssh -t -o StrictHostKeyChecking=yes '<backend-instance-or-service-domain>@ssh.railway.com' \
  'cd /app && java -Dloader.main=com.marinarodriiphoto.backend.tools.ProvisionDevelopmentAdmins \
    -cp target/backend-0.0.1-SNAPSHOT.jar \
    org.springframework.boot.loader.launch.PropertiesLauncher --hosted'
```

The hosted tool verifies the authenticated schema, database account, successful migrations, and empty account table. Enter Marina's email first, then Lorena's. Enter and confirm a unique password for each account at the hidden prompts. Use a password manager to generate passwords of at least 12 characters and at most 72 UTF-8 bytes. Use a distinct temporary password for Marina. Type `PROVISION railway` only for the verified production schema. Never put credentials in command arguments, transcripts, environment files, screenshots or chat.

Share the temporary password privately with Marina using an approved password-manager share or an in-person handoff. She signs in at `/admin` and enters the temporary password again to choose her own. The backend allows session inspection, password change and logout during this step and denies portfolio management. A successful change revokes all sessions for that account, so she signs in again with the new password. Both admins then have the same permissions and can change their own password through **Alterar senha**.

## Account-specific reset

Verify the requester through a trusted channel and get approval for the specific account. Use the provisioning command with `--hosted-reset` in place of `--hosted`. Enter only the intended account's email and a fresh temporary password at the hidden prompts. Confirm with `RESET railway <account-email>` only after checking the schema and email. The reset changes one enabled account, revokes its sessions on subsequent requests, and requires another password change at next login. An unknown or disabled account is rejected. Deliver the temporary password privately as above and confirm sign-in after the recipient changes it.

## Operational limits

- Sessions and rate limits are in process. Keep one backend replica for this rollout. Restarts sign users out. The per-address limit may be shared behind the proxy; verify it before launch. A request already authorized and in progress when a credential changes can still finish.
- The admin uses passwords and has no MFA or self-service recovery. The temporary password remains usable for the restricted session until it is changed or administratively reset, so coordinate the handoff and first sign-in promptly.
- Keep the backend request-detail logging and API caching disabled. Verify the upstream upload size and timeout limits with the actual Vercel deployment before launch.

## Local development

Start the backend from `backend/` using the ignored `.env`. Apply V4 once to a verified local schema using the non-web command above with the development profile and local credentials. Keep the migration disabled for subsequent normal startup. Vite shows the admin route in development, includes development sample controls, and proxies the APIs to loopback. Set `VITE_PUBLIC_PORTFOLIO_API=true` locally to test the API-backed gallery. Use `ADMIN_SESSION_COOKIE_SECURE=false` only if needed for local HTTP development.
