-- Creates or updates one Better Auth email/password admin account.
-- Generate a compatible password hash with:
-- bun -e "import { hashPassword } from 'better-auth/crypto'; console.log(await hashPassword('ChangeMeAdmin123!'))"

DO $$
DECLARE
	admin_user_id text := 'admin_user_001';
	admin_name text := 'Admin User';
	admin_email text := 'admin@example.com';
	admin_password_hash text := 'a1d1ff70e567189c86be70a9853de7bd:80155c9cf8465ac207b8b8dcb0794dbdcc9f40e07b4c27e3ceab92b67d6a5074265cda152e0d4b824b6f42fb52ae36c41c48c414817d794660f8600f5cdc3011';
	actual_user_id text;
BEGIN
	IF admin_password_hash = 'REPLACE_WITH_BETTER_AUTH_PASSWORD_HASH' THEN
		RAISE EXCEPTION 'Replace admin_password_hash with a Better Auth password hash before running this seed.';
	END IF;

	INSERT INTO "user" (
		"id",
		"name",
		"email",
		"email_verified",
		"image",
		"role",
		"created_at",
		"updated_at"
	)
	VALUES (
		admin_user_id,
		admin_name,
		lower(admin_email),
		true,
		NULL,
		'admin'::user_role,
		now(),
		now()
	)
	ON CONFLICT ("email") DO UPDATE
	SET
		"name" = EXCLUDED."name",
		"email_verified" = true,
		"role" = 'admin'::user_role,
		"updated_at" = now()
	RETURNING "id" INTO actual_user_id;

	IF EXISTS (
		SELECT 1
		FROM "account"
		WHERE "user_id" = actual_user_id
			AND "provider_id" = 'credential'
	) THEN
		UPDATE "account"
		SET
			"account_id" = actual_user_id,
			"password" = admin_password_hash,
			"updated_at" = now()
		WHERE "user_id" = actual_user_id
			AND "provider_id" = 'credential';
	ELSE
		INSERT INTO "account" (
			"id",
			"account_id",
			"provider_id",
			"user_id",
			"password",
			"created_at",
			"updated_at"
		)
		VALUES (
			'credential_' || actual_user_id,
			actual_user_id,
			'credential',
			actual_user_id,
			admin_password_hash,
			now(),
			now()
		);
	END IF;
END $$;
