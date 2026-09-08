import { prisma } from "@/lib/prisma";
import { normalizeNewsletterEmail } from "@/lib/newsletter/repository";

function clip(raw: unknown, max: number): string {
  if (typeof raw !== "string") return "";
  return raw.trim().slice(0, max);
}

export type DemoRequestInput = {
  name: unknown;
  email: unknown;
  company: unknown;
  role?: unknown;
  goal?: unknown;
  source?: unknown;
};

export async function createDemoRequest(input: DemoRequestInput): Promise<{
  id: string;
  email: string;
}> {
  const name = clip(input.name, 120);
  const company = clip(input.company, 160);
  const role = clip(input.role, 120) || null;
  const goal = clip(input.goal, 500) || null;
  const source = clip(input.source, 40) || "demo_page";
  const email =
    typeof input.email === "string"
      ? normalizeNewsletterEmail(input.email)
      : null;

  if (!name) throw new Error("invalid_name");
  if (!email) throw new Error("invalid_email");
  if (!company) throw new Error("invalid_company");

  const row = await prisma.demoRequest.create({
    data: { name, email, company, role, goal, source },
    select: { id: true, email: true },
  });
  return row;
}

export async function listDemoRequests() {
  return prisma.demoRequest.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      role: true,
      goal: true,
      source: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function countDemoRequests() {
  return prisma.demoRequest.count();
}
