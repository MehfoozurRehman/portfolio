import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

type LeadRequest = {
  name?: unknown;
  email?: unknown;
  project?: unknown;
};

function isLeadRequest(value: unknown): value is LeadRequest {
  return typeof value === "object" && value !== null;
}

http.route({
  path: "/portfolioLead",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body: unknown = await request.json();

    if (!isLeadRequest(body)) {
      return new Response("Invalid request body", { status: 400 });
    }

    if (
      typeof body.name !== "string" ||
      typeof body.email !== "string" ||
      typeof body.project !== "string" ||
      body.name.trim().length === 0 ||
      body.email.trim().length === 0 ||
      body.project.trim().length === 0
    ) {
      return new Response("Missing required fields", { status: 400 });
    }

    await ctx.runMutation(api.leads.create, {
      name: body.name.trim(),
      email: body.email.trim(),
      project: body.project.trim(),
      source: "portfolio",
    });

    return Response.json({ ok: true });
  }),
});

export default http;
