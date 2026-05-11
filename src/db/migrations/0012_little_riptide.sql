CREATE TYPE "public"."vital_status" AS ENUM('living', 'deceased', 'unknown');--> statement-breakpoint
ALTER TABLE "parents" RENAME COLUMN "is_deceased" TO "vital_status";