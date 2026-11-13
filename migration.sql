CREATE TABLE "booking_assignments" (
	"booking_id" integer,
	"staff_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_assignments_pkey" PRIMARY KEY("booking_id","staff_id")
);
--> statement-breakpoint
CREATE TABLE "booking_events" (
	"id" serial PRIMARY KEY,
	"booking_id" integer NOT NULL,
	"actor" text DEFAULT '' NOT NULL,
	"action" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY,
	"source" text DEFAULT 'website' NOT NULL,
	"request_type" text DEFAULT 'booking' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text DEFAULT '' NOT NULL,
	"customer_phone" text DEFAULT '' NOT NULL,
	"property_address" text DEFAULT '' NOT NULL,
	"property_type" text DEFAULT '' NOT NULL,
	"bedrooms" text DEFAULT '' NOT NULL,
	"bathrooms" text DEFAULT '' NOT NULL,
	"service_type" text DEFAULT '' NOT NULL,
	"add_ons" jsonb DEFAULT '[]' NOT NULL,
	"preferred_date" date,
	"preferred_time" text DEFAULT '' NOT NULL,
	"scheduled_date" date,
	"scheduled_time" text DEFAULT '' NOT NULL,
	"instructions" text DEFAULT '' NOT NULL,
	"special_requests" text DEFAULT '' NOT NULL,
	"internal_notes" text DEFAULT '' NOT NULL,
	"price" text DEFAULT '' NOT NULL,
	"deposit_status" text DEFAULT 'none' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_photos" (
	"id" serial PRIMARY KEY,
	"booking_id" integer NOT NULL,
	"staff_id" integer,
	"kind" text DEFAULT 'after' NOT NULL,
	"blob_key" text NOT NULL,
	"content_type" text DEFAULT 'image/jpeg' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_reports" (
	"id" serial PRIMARY KEY,
	"booking_id" integer NOT NULL,
	"staff_id" integer,
	"checklist" jsonb DEFAULT '[]' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"issues" text DEFAULT '' NOT NULL,
	"supplies_needed" text DEFAULT '' NOT NULL,
	"reviewed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" serial PRIMARY KEY,
	"email" text NOT NULL UNIQUE,
	"name" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"role" text DEFAULT 'employee' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"identity_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_completions" (
	"material_id" integer,
	"staff_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "training_completions_pkey" PRIMARY KEY("material_id","staff_id")
);
--> statement-breakpoint
CREATE TABLE "training_materials" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"kind" text DEFAULT 'text' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"external_url" text DEFAULT '' NOT NULL,
	"file_id" text,
	"file_name" text DEFAULT '' NOT NULL,
	"content_type" text DEFAULT '' NOT NULL,
	"file_size" bigint DEFAULT 0 NOT NULL,
	"chunk_size" integer DEFAULT 0 NOT NULL,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"created_by" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "assignments_staff_idx" ON "booking_assignments" ("staff_id");--> statement-breakpoint
CREATE INDEX "events_booking_idx" ON "booking_events" ("booking_id");--> statement-breakpoint
CREATE INDEX "bookings_scheduled_idx" ON "bookings" ("scheduled_date");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" ("status");--> statement-breakpoint
CREATE INDEX "photos_booking_idx" ON "job_photos" ("booking_id");--> statement-breakpoint
CREATE INDEX "reports_booking_idx" ON "job_reports" ("booking_id");--> statement-breakpoint
ALTER TABLE "booking_assignments" ADD CONSTRAINT "booking_assignments_booking_id_bookings_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "booking_assignments" ADD CONSTRAINT "booking_assignments_staff_id_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_booking_id_bookings_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "job_photos" ADD CONSTRAINT "job_photos_booking_id_bookings_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "job_photos" ADD CONSTRAINT "job_photos_staff_id_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "job_reports" ADD CONSTRAINT "job_reports_booking_id_bookings_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "job_reports" ADD CONSTRAINT "job_reports_staff_id_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "training_completions" ADD CONSTRAINT "training_completions_material_id_training_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "training_materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "training_completions" ADD CONSTRAINT "training_completions_staff_id_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE;