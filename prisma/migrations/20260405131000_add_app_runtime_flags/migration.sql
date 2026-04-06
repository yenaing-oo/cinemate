-- CreateTable
CREATE TABLE "app_runtime_flags" (
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_runtime_flags_pkey" PRIMARY KEY ("key")
);

-- Seed default runtime flag row
INSERT INTO "app_runtime_flags" ("key", "enabled")
VALUES ('load_test_auth_enabled', false)
ON CONFLICT ("key") DO NOTHING;
