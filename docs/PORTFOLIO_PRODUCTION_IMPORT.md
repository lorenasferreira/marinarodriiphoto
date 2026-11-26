# One-time production Portfolio import

Run this after an approved Railway backend deployment containing the importer. The backend needs V1–V3 already applied to the intended hosted MySQL schema, with the existing `production` profile and `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` configured. Keep MySQL private. The importer reads only the bundled photo manifest, writes only `portfolio_photos`, and leaves any matching rows as they are. It runs directly from the JAR without starting Spring or Flyway.

## Prepare locally

From the repository root, generate and validate the manifest against the bundled originals and thumbnails. Keep the JSON outside the repository.

```sh
node frontend/scripts/preview-portfolio-import.js > /tmp/marina-portfolio-manifest.json
shasum -a 256 /tmp/marina-portfolio-manifest.json
```

Expect 89 photos, with 6 publicity, 6 events-bts, 51 editorial-artistic, and 26 portraits. This manifest contains no database export or test Cloudinary upload.

## Transfer to the Railway backend container

Use the backend service's public service domain or the **service instance ID**, plus an SSH key registered with Railway. Railway documents SFTP-backed OpenSSH `scp` for file transfers. On older OpenSSH clients that default to the legacy protocol, use `scp -s`. Use the same running instance for transfer and execution. Container files are temporary and may disappear on redeploy. [Railway SSH and SCP](https://docs.railway.com/cli/ssh)

On your local machine, replace the placeholder with the value for the intended backend instance:

```sh
RAILWAY_SSH_TARGET='<backend-domain-or-instance-id>@ssh.railway.com'
RAILWAY_IMPORT_DIR=$(ssh "$RAILWAY_SSH_TARGET" 'umask 077; mktemp -d /tmp/marina-portfolio.XXXXXX') &&
  test -n "$RAILWAY_IMPORT_DIR" &&
  scp /tmp/marina-portfolio-manifest.json "$RAILWAY_SSH_TARGET:$RAILWAY_IMPORT_DIR/manifest.json" &&
  ssh "$RAILWAY_SSH_TARGET" "sha256sum '$RAILWAY_IMPORT_DIR/manifest.json'"
```

Compare the remote SHA-256 with the local one before continuing. Use `ssh -t` for apply so Java has an interactive console for confirmation. The examples use Railpack's application directory `/app`. If the confirmed backend image uses a different working directory, use the directory containing the packaged `target/backend-0.0.1-SNAPSHOT.jar`.

## Dry run

From your local terminal, run the Java command inside the backend container:

```sh
ssh "$RAILWAY_SSH_TARGET" "cd /app && java \
  -Dloader.main=com.marinarodriiphoto.backend.tools.ImportHostedPortfolio \
  -cp target/backend-0.0.1-SNAPSHOT.jar \
  org.springframework.boot.loader.launch.PropertiesLauncher \
  --dry-run '$RAILWAY_IMPORT_DIR/manifest.json'"
```

Review the schema name and counts. An empty photo table should produce `Expected inserts: 89 | Skips: 0 | Conflicts: 0` and `No rows written.` The command uses a read-only transaction and verifies the authenticated schema and account, migration history, InnoDB, and the source-path unique index. If there are conflicts or unexpected counts, stop and investigate.

## Apply and verify

After approval to write to the verified hosted schema, run:

```sh
ssh -t "$RAILWAY_SSH_TARGET" "cd /app && java \
  -Dloader.main=com.marinarodriiphoto.backend.tools.ImportHostedPortfolio \
  -cp target/backend-0.0.1-SNAPSHOT.jar \
  org.springframework.boot.loader.launch.PropertiesLauncher \
  --apply '$RAILWAY_IMPORT_DIR/manifest.json'"
```

Apply repeats the preview. Type the exact `IMPORT <schema>` prompt only if the counts are expected. It locks and rechecks the plan in a serializable transaction before inserting the missing photos as published. If the plan changes, a conflict appears, or the database rejects the batch, the transaction rolls back.

Repeat the dry-run command. Expect `Expected inserts: 0 | Skips: 89 | Conflicts: 0` and `No rows written.` When ready, use the authenticated admin photo list to confirm the category counts and initial visibility. If the apply connection drops or the commit result is unclear, run dry-run to confirm the state before retrying.

Remove only the transferred JSON and its temporary directory after verification:

```sh
ssh "$RAILWAY_SSH_TARGET" "rm -- '$RAILWAY_IMPORT_DIR/manifest.json' && rmdir -- '$RAILWAY_IMPORT_DIR'"
```
