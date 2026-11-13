import { pgTable, serial, text, timestamp, integer, boolean, date, jsonb, index, primaryKey, bigint } from "drizzle-orm/pg-core";

// Team members who may sign in to the private portal. Access is granted by this table, not by Identity alone.
export const staff = pgTable("staff", {
  id: serial().primaryKey(),
  email: text().notNull().unique(),
  name: text().notNull().default(""),
  phone: text().notNull().default(""),
  role: text().notNull().default("employee"), // 'owner' | 'employee'
  active: boolean().notNull().default(true),
  identityId: text("identity_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookings = pgTable(
  "bookings",
  {
    id: serial().primaryKey(),
    source: text().notNull().default("website"), // 'website' | 'portal'
    requestType: text("request_type").notNull().default("booking"), // 'booking' | 'quote'
    status: text().notNull().default("pending"), // pending | scheduled | in_progress | completed | cancelled
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull().default(""),
    customerPhone: text("customer_phone").notNull().default(""),
    propertyAddress: text("property_address").notNull().default(""),
    propertyType: text("property_type").notNull().default(""),
    bedrooms: text().notNull().default(""), // studio | 1 | 2 | 3 | 4 | 5
    bathrooms: text().notNull().default(""),
    serviceType: text("service_type").notNull().default(""),
    addOns: jsonb("add_ons").$type<string[]>().notNull().default([]),
    preferredDate: date("preferred_date", { mode: "string" }),
    preferredTime: text("preferred_time").notNull().default(""),
    scheduledDate: date("scheduled_date", { mode: "string" }),
    scheduledTime: text("scheduled_time").notNull().default(""),
    instructions: text().notNull().default(""), // cleaning & access instructions (visible to assigned employees)
    specialRequests: text("special_requests").notNull().default(""),
    internalNotes: text("internal_notes").notNull().default(""), // owner only
    price: text().notNull().default(""), // owner only, free-form (e.g. "$155" or "Quote sent: $320")
    depositStatus: text("deposit_status").notNull().default("none"), // none | requested | paid
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("bookings_scheduled_idx").on(t.scheduledDate), index("bookings_status_idx").on(t.status)],
);

export const bookingAssignments = pgTable(
  "booking_assignments",
  {
    bookingId: integer("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
    staffId: integer("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.bookingId, t.staffId] }), index("assignments_staff_idx").on(t.staffId)],
);

export const bookingEvents = pgTable(
  "booking_events",
  {
    id: serial().primaryKey(),
    bookingId: integer("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
    actor: text().notNull().default(""),
    action: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("events_booking_idx").on(t.bookingId)],
);

export const jobReports = pgTable(
  "job_reports",
  {
    id: serial().primaryKey(),
    bookingId: integer("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
    staffId: integer("staff_id").references(() => staff.id, { onDelete: "set null" }),
    checklist: jsonb().$type<string[]>().notNull().default([]),
    notes: text().notNull().default(""),
    issues: text().notNull().default(""),
    suppliesNeeded: text("supplies_needed").notNull().default(""),
    reviewed: boolean().notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reports_booking_idx").on(t.bookingId)],
);

export const jobPhotos = pgTable(
  "job_photos",
  {
    id: serial().primaryKey(),
    bookingId: integer("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
    staffId: integer("staff_id").references(() => staff.id, { onDelete: "set null" }),
    kind: text().notNull().default("after"), // before | after
    blobKey: text("blob_key").notNull(),
    contentType: text("content_type").notNull().default("image/jpeg"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("photos_booking_idx").on(t.bookingId)],
);

export const trainingMaterials = pgTable("training_materials", {
  id: serial().primaryKey(),
  title: text().notNull(),
  category: text().notNull(),
  kind: text().notNull().default("text"), // text | file | link
  description: text().notNull().default(""),
  body: text().notNull().default(""),
  externalUrl: text("external_url").notNull().default(""),
  fileId: text("file_id"),
  fileName: text("file_name").notNull().default(""),
  contentType: text("content_type").notNull().default(""),
  fileSize: bigint("file_size", { mode: "number" }).notNull().default(0),
  chunkSize: integer("chunk_size").notNull().default(0),
  chunkCount: integer("chunk_count").notNull().default(0),
  required: boolean().notNull().default(false),
  createdBy: text("created_by").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const trainingCompletions = pgTable(
  "training_completions",
  {
    materialId: integer("material_id").notNull().references(() => trainingMaterials.id, { onDelete: "cascade" }),
    staffId: integer("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.materialId, t.staffId] })],
);

export const settings = pgTable("settings", {
  key: text().primaryKey(),
  value: jsonb().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
