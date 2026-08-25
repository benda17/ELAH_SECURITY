import { NextRequest, NextResponse } from "next/server";
import { createContact, listContacts, updateContact } from "@/lib/roadmap/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const contacts = await listContacts();
  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const contact = await createContact({
    name: body.name.trim(),
    organization: body.organization ?? null,
    role: body.role ?? null,
    contactType: body.contactType ?? "potential_banking_customer",
    email: body.email ?? null,
    linkedInUrl: body.linkedInUrl ?? null,
    sector: body.sector ?? null,
    relevance: body.relevance ?? null,
    outreachStatus: body.outreachStatus ?? "research",
    lastContactDate: body.lastContactDate ? new Date(body.lastContactDate) : null,
    nextFollowUp: body.nextFollowUp ? new Date(body.nextFollowUp) : null,
    notes: body.notes ?? null,
    associatedTasks: body.associatedTasks ?? [],
    potentialValue: body.potentialValue ?? null,
    priority: body.priority ?? "medium",
  });
  return NextResponse.json({ contact }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const patch = { ...body };
  if (body.nextFollowUp !== undefined) {
    patch.nextFollowUp = body.nextFollowUp ? new Date(body.nextFollowUp) : null;
  }
  if (body.lastContactDate !== undefined) {
    patch.lastContactDate = body.lastContactDate
      ? new Date(body.lastContactDate)
      : null;
  }
  delete patch.id;
  const contact = await updateContact(body.id, patch);
  return NextResponse.json({ contact });
}
