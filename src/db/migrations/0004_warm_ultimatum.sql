CREATE TABLE "staff_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"department" text NOT NULL,
	"position" text NOT NULL,
	"role" "user_role" NOT NULL,
	"contact_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;