# Commercial Portfolio uploads

The development admin uploads one still JPEG, PNG or WebP at a time. Uploads enter the Portfolio database as unpublished. The public Portfolio continues to use its static manifest.

## Local configuration

Keep `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` in the backend environment or the ignored backend `.env`. Use a development Cloudinary product environment. Signed server-side uploads require no browser credential or unsigned preset. Assets go into `marinarodriiphoto/portfolio` with a server-generated UUID, authenticated delivery and overwrite disabled.

`PORTFOLIO_UPLOAD_MAX_FILE_SIZE` defaults to `20MB`. `PORTFOLIO_UPLOAD_MAX_REQUEST_SIZE` defaults to `21MB` to allow multipart overhead. Keep the request limit above the file limit. Images are capped at 25 megapixels and 10,000 pixels per side. A single backend process runs up to two Portfolio uploads concurrently.

The original is uploaded without an incoming transformation. The API returns signed original and derivative URLs, with `f_auto,q_auto` and a finite range of widths up to 1920 pixels. Signed delivery URLs can be shared by someone who receives them. Keep them in the admin, and treat the original as potentially containing camera metadata. Storage, on-demand transformations and delivery bandwidth count toward the Cloudinary plan.

## Reconcile an uncertain upload

A provider error, database save error or interrupted backend process can leave a Cloudinary asset without a confirmed MySQL row. The backend logs the predicted public ID before uploading. When the provider returns an asset ID, a database save failure logs that ID too. The UI shows a reference when an error response is available.

1. Pause retries and find the matching `marinarodriiphoto/portfolio/<reference>` in the local backend logs. If the browser lost the response, use the attempt's timestamp to identify its public ID. Wait for any in-flight upload or database transaction to finish.
2. Verify the Cloudinary product environment, exact public ID, authenticated delivery type, creation timestamp and asset ID in Media Library. Stop if the asset cannot be attributed to the failed attempt.
3. Query `marinarodriiphoto_dev.portfolio_photos` with a read-only connection for that exact `cloudinary_public_id` **or** `cloudinary_asset_id`. If either matches a row, preserve the asset and reload the admin. If neither matches, record the orphan's IDs and have the Cloudinary account owner review removal of that exact asset in Media Library.
4. Retry only after reconciliation. Each retry creates a different UUID. The admin API never deletes Cloudinary assets automatically.

## Photo names and accessibility

| Field | Purpose |
| --- | --- |
| Original filename | Read-only technical metadata for identifying the source file. Editing photo details never renames the file or changes its source path or delivery URLs. |
| Photo title | Optional admin label, up to 160 characters. Use a short name such as “Window Light Portrait” to help someone find the photo in the library. Untitled photos can still be found by filename. The displayed filename fallback is never saved as a title. |
| Alt text | Optional description of the image for someone who cannot see it, up to 255 characters. For example, “Portrait of a dancer sitting by a window, with soft light across her face.” A title and a description can both be useful and are saved separately. |
| Cloudinary identifiers | The public ID is the provider's delivery identifier and the asset ID identifies the stored asset. Neither changes when the title or alt text is edited. Imported bundled photographs can have neither identifier. |

Flyway V3 adds only the nullable `portfolio_photos.title` column. It does not backfill titles. Multipart uploads may include `title`. Metadata updates preserve the existing title when the JSON field is omitted. An explicit `null` or blank string clears it.

### Apply V3 in development after approval

Use the existing MAMP instance on port 8889. Confirm the ignored backend configuration targets `marinarodriiphoto_dev` as `marina_dev`. Stop the local backend so no edits are in flight, make a development backup, and record the current row counts and successful migration versions with a read-only query.

```sh
mysql --protocol=TCP -h 127.0.0.1 -P 8889 -u marina_dev -p \
  --database=marinarodriiphoto_dev \
  --execute='SELECT DATABASE(), CURRENT_USER(); SELECT COUNT(*) AS photos, COUNT(import_source_path) AS bundled FROM portfolio_photos; SELECT version, success FROM flyway_schema_history ORDER BY installed_rank;'
```

From `backend/`, package the updated backend and enable Flyway only for the one non-web process.

```sh
mvn -o -DskipTests package
DEV_FLYWAY_ENABLED=true java -jar target/backend-0.0.1-SNAPSHOT.jar \
  --spring.main.web-application-type=none --spring.flyway.target=3
```

Repeat the preflight query to confirm the counts match and V3 is successful. Before restarting the web backend, verify the new column is nullable and no titles were backfilled.

```sh
mysql --protocol=TCP -h 127.0.0.1 -P 8889 -u marina_dev -p \
  --database=marinarodriiphoto_dev \
  --execute="SHOW COLUMNS FROM portfolio_photos LIKE 'title'; SELECT COUNT(title) AS titled FROM portfolio_photos;"
```

Expect `varchar(160)`, nullable, and zero titled rows. Restart the web backend and frontend with Flyway disabled.
