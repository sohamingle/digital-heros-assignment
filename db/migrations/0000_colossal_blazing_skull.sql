CREATE TYPE "public"."draw_logic" AS ENUM('random', 'algorithmic');--> statement-breakpoint
CREATE TYPE "public"."draw_status" AS ENUM('draft', 'simulated', 'published');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('none', 'active', 'cancelled', 'lapsed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "charity" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"image" text,
	"website" text,
	"featured" boolean DEFAULT false NOT NULL,
	"events" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"charity_id" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "draw" (
	"id" text PRIMARY KEY NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"logic" "draw_logic" DEFAULT 'random' NOT NULL,
	"status" "draw_status" DEFAULT 'draft' NOT NULL,
	"drawn_numbers" jsonb,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "draw_result" (
	"id" text PRIMARY KEY NOT NULL,
	"draw_id" text NOT NULL,
	"user_id" text NOT NULL,
	"matched_numbers" jsonb,
	"match_count" integer DEFAULT 0 NOT NULL,
	"prize_amount" numeric(12, 2) DEFAULT '0',
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "golf_score" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"score" integer NOT NULL,
	"played_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jackpot_rollover" (
	"id" text PRIMARY KEY NOT NULL,
	"from_draw_id" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"claimed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prize_pool" (
	"id" text PRIMARY KEY NOT NULL,
	"draw_id" text NOT NULL,
	"tier" integer NOT NULL,
	"base_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"rollover_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(12, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"charity_id" text,
	"charity_percentage" integer DEFAULT 10,
	"stripe_customer_id" text,
	"subscription_status" "subscription_status" DEFAULT 'none' NOT NULL,
	"subscription_plan" "subscription_plan",
	"subscription_expires_at" timestamp,
	"stripe_subscription_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "winner_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"draw_result_id" text NOT NULL,
	"proof_url" text NOT NULL,
	"status" "verification_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donation" ADD CONSTRAINT "donation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donation" ADD CONSTRAINT "donation_charity_id_charity_id_fk" FOREIGN KEY ("charity_id") REFERENCES "public"."charity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draw_result" ADD CONSTRAINT "draw_result_draw_id_draw_id_fk" FOREIGN KEY ("draw_id") REFERENCES "public"."draw"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draw_result" ADD CONSTRAINT "draw_result_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "golf_score" ADD CONSTRAINT "golf_score_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jackpot_rollover" ADD CONSTRAINT "jackpot_rollover_from_draw_id_draw_id_fk" FOREIGN KEY ("from_draw_id") REFERENCES "public"."draw"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prize_pool" ADD CONSTRAINT "prize_pool_draw_id_draw_id_fk" FOREIGN KEY ("draw_id") REFERENCES "public"."draw"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "winner_verification" ADD CONSTRAINT "winner_verification_draw_result_id_draw_result_id_fk" FOREIGN KEY ("draw_result_id") REFERENCES "public"."draw_result"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "donation_userId_idx" ON "donation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "donation_charityId_idx" ON "donation" USING btree ("charity_id");--> statement-breakpoint
CREATE INDEX "draw_result_drawId_idx" ON "draw_result" USING btree ("draw_id");--> statement-breakpoint
CREATE INDEX "draw_result_userId_idx" ON "draw_result" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "golf_score_userId_idx" ON "golf_score" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "golf_score_user_date_idx" ON "golf_score" USING btree ("user_id","played_date");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");