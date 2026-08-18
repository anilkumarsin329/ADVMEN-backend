/**
 * config/r2.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Cloudflare R2 S3 Client Configuration
 * ─────────────────────────────────────────────────────────────
 */

const { S3Client } = require('@aws-sdk/client-s3')

const endpoint = process.env.R2_ENDPOINT
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const bucketName = process.env.R2_BUCKET || 'advmenngo'

if (!endpoint || !accessKeyId || !secretAccessKey) {
  console.warn('WARNING: Cloudflare R2 configuration missing from environment variables!')
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
})

module.exports = {
  s3Client,
  bucketName
}
