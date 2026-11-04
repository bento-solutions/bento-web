import 'dotenv/config'

// Integration tests run against their own database, created by tests/workflow.test.ts on the local Postgres.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5440/bento_web_test'
process.env.PAYLOAD_SECRET ||= 'test-secret'
process.env.MEDIA_DIR = process.env.TEST_MEDIA_DIR || '/tmp/bento-web-test-media'
