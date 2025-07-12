import { defineSchema, defineTable } from "convex/server";

import { v } from "convex/values";

export default defineSchema({
  testimonials: defineTable({
    name: v.string(),
    designation: v.string(),
    message: v.string(),
  }),
});
