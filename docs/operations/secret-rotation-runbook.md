# Secret rotation runbook

## Purpose

Use this runbook whenever a credential is shared, committed, logged, or otherwise exposed outside its approved secret store.

## Required rotation order

1. Rotate the MongoDB Atlas database-user password and update the URI.
2. Generate and deploy a new JWT signing secret.
3. Rotate the SMTP/app password.
4. Rotate the Cloudinary API secret.
5. Generate a new VAPID public/private key pair.
6. Rotate the Gemini API key.
7. Rotate the Anthropic API key if the service is enabled.

## Record

Record only the provider, variable name, rotation date, owner, staging update status, production update status, and old-credential revocation status. Never record credential values in this file, a ticket, a commit message, or logs.

## Verification

After updating each environment, verify the API readiness endpoint and the affected integration using non-production data in staging before revoking the old credential.
