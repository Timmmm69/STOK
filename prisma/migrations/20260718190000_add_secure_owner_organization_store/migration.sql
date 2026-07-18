-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE');

-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('ACTIVE');

-- CreateTable
CREATE TABLE "auth_users" (
    "id" VARCHAR(128) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "auth_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "ip_address" VARCHAR(64),
    "user_agent" TEXT,
    "user_id" VARCHAR(128) NOT NULL,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_accounts" (
    "id" VARCHAR(128) NOT NULL,
    "account_id" VARCHAR(255) NOT NULL,
    "provider_id" VARCHAR(64) NOT NULL,
    "user_id" VARCHAR(128) NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMPTZ(3),
    "refresh_token_expires_at" TIMESTAMPTZ(3),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "auth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_verifications" (
    "id" VARCHAR(128) NOT NULL,
    "identifier" VARCHAR(320) NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "auth_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "default_currency" CHAR(3) NOT NULL DEFAULT 'BYN',
    "default_timezone" VARCHAR(64) NOT NULL DEFAULT 'Europe/Minsk',
    "locale" VARCHAR(16) NOT NULL DEFAULT 'ru',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_memberships" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" VARCHAR(128) NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'OWNER',
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "status" "StoreStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_setups" (
    "id" UUID NOT NULL,
    "user_id" VARCHAR(128) NOT NULL,
    "organization_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "idempotency_key" VARCHAR(128) NOT NULL,
    "request_fingerprint" CHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_setups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_users_email_key" ON "auth_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_token_key" ON "auth_sessions"("token");

-- CreateIndex
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions"("user_id");

-- CreateIndex
CREATE INDEX "auth_accounts_user_id_idx" ON "auth_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_accounts_provider_id_account_id_key" ON "auth_accounts"("provider_id", "account_id");

-- CreateIndex
CREATE INDEX "auth_verifications_identifier_idx" ON "auth_verifications"("identifier");

-- CreateIndex
CREATE INDEX "organization_memberships_user_id_status_idx" ON "organization_memberships"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "organization_memberships_organization_id_user_id_key" ON "organization_memberships"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "stores_organization_id_status_idx" ON "stores"("organization_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "stores_organization_id_name_key" ON "stores"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "organization_setups_user_id_key" ON "organization_setups"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_setups_organization_id_key" ON "organization_setups"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_setups_store_id_key" ON "organization_setups"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_setups_user_id_idempotency_key_key" ON "organization_setups"("user_id", "idempotency_key");

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_setups" ADD CONSTRAINT "organization_setups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_setups" ADD CONSTRAINT "organization_setups_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_setups" ADD CONSTRAINT "organization_setups_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
