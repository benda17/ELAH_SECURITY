import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeNewsletterEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return null;
  return email;
}

export async function createNewsletterSubscriber(input: {
  email: string;
  source?: string;
}): Promise<{ created: boolean; email: string }> {
  const email = normalizeNewsletterEmail(input.email);
  if (!email) {
    throw new Error("invalid_email");
  }

  const source = (input.source ?? "hero").trim() || "hero";

  try {
    await prisma.newsletterSubscriber.create({
      data: { email, source },
    });
    return { created: true, email };
  } catch (err) {
    const code =
      typeof err === "object" && err && "code" in err
        ? String((err as { code?: string }).code)
        : "";
    if (code === "P2002") {
      return { created: false, email };
    }
    throw err;
  }
}

export async function listNewsletterSubscribers() {
  return prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, source: true, createdAt: true },
  });
}

export async function countNewsletterSubscribers() {
  return prisma.newsletterSubscriber.count();
}
