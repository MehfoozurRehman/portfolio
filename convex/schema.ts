import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  leads: defineTable({
    name: v.string(),
    email: v.string(),
    project: v.string(),
    source: v.string(),
  }).index("by_email", ["email"]),
});
