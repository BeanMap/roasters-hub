import { Resend } from "resend";
import { db } from "@/lib/db";

// Created lazily: `new Resend()` throws without an API key, which used to break
// `next build` (page data collection) whenever RESEND_API_KEY was not set.
let resendClient: Resend | null = null;
function getResend(): Resend {
  resendClient ??= new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

const fromEmail =
  process.env.RESEND_FROM_EMAIL || "Bean Map <noreply@beanmap.cafe>";

/**
 * Send email via Resend. Logs errors but never throws —
 * email failures should not block server actions.
 */
async function send(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping email");
    return false;
  }

  try {
    const { error } = await getResend().emails.send({
      from: fromEmail,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return false;
  }
}

// ── Admin notification: new registration ────────────────────────────────────

export async function sendNewRegistrationNotification(roaster: {
  name: string;
  city: string;
  country: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("[email] ADMIN_EMAIL not set — skipping admin notification");
    return;
  }

  await send({
    to: adminEmail,
    subject: `New roaster registration: ${roaster.name}`,
    html: `
      <h2>New Roaster Registration</h2>
      <p>A new roaster has registered and is awaiting verification:</p>
      <ul>
        <li><strong>Name:</strong> ${roaster.name}</li>
        <li><strong>City:</strong> ${roaster.city}</li>
        <li><strong>Country:</strong> ${roaster.country}</li>
      </ul>
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://beanmap-web.vercel.app"}/admin/pending">
          Review in Admin Panel →
        </a>
      </p>
    `,
  });
}

// ── Roaster notification: verified ──────────────────────────────────────────

export async function sendRoasterVerifiedEmail(roaster: {
  email: string;
  name: string;
  slug: string;
}) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://beanmap-web.vercel.app";

  await send({
    to: roaster.email,
    subject: `${roaster.name} is now live on Bean Map!`,
    html: `
      <h2>Welcome to Bean Map, ${roaster.name}! ☕</h2>
      <p>Great news — your roaster profile has been verified and is now live on Bean Map.</p>
      <p>
        <a href="${appUrl}/roasters/${roaster.slug}">View your profile →</a>
      </p>
      <p>
        You can manage your profile from the
        <a href="${appUrl}/dashboard/roaster">Roaster Dashboard</a>.
      </p>
      <p>If you have any questions, just reply to this email.</p>
      <p>— The Bean Map Team</p>
    `,
  });
}

// ── Roaster notification: rejected ──────────────────────────────────────────

export async function sendRoasterRejectedEmail(roaster: {
  email: string;
  name: string;
  reason: string;
}) {
  await send({
    to: roaster.email,
    subject: `Update on your Bean Map registration — ${roaster.name}`,
    html: `
      <h2>Registration Update</h2>
      <p>Hi ${roaster.name},</p>
      <p>Unfortunately, we were unable to verify your roaster profile at this time.</p>
      <p><strong>Reason:</strong> ${roaster.reason}</p>
      <p>
        You're welcome to register again at
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://beanmap-web.vercel.app"}/register">
          beanmap.cafe/register
        </a>
        once the issue is resolved.
      </p>
      <p>If you have questions, just reply to this email.</p>
      <p>— The Bean Map Team</p>
    `,
  });
}

// ── Newsletter digest ───────────────────────────────────────────────────────

export async function sendNewsletterDigest(): Promise<{
  sent: number;
  failed: number;
}> {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://beanmap-web.vercel.app";

  // Fetch roasters verified in the last 7 days
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const newRoasters = await db.roaster.findMany({
    where: {
      status: "VERIFIED",
      verifiedAt: { gte: oneWeekAgo },
    },
    select: { name: true, slug: true, city: true, country: true },
    orderBy: { verifiedAt: "desc" },
    take: 10,
  });

  const totalRoasters = await db.roaster.count({
    where: { status: "VERIFIED" },
  });

  // Build roaster list HTML
  const roasterListHtml =
    newRoasters.length > 0
      ? newRoasters
          .map(
            (r: { name: string; slug: string; city: string; country: string }) =>
              `<li><a href="${appUrl}/roasters/${r.slug}">${r.name}</a> — ${r.city}, ${r.country}</li>`,
          )
          .join("\n")
      : "<li>No new roasters this week — check back soon!</li>";

  const subject =
    newRoasters.length > 0
      ? `${newRoasters.length} new roaster${newRoasters.length === 1 ? "" : "s"} on Bean Map this week`
      : "Your weekly Bean Map update";

  const html = `
    <h2>Weekly Bean Map Digest ☕</h2>
    ${
      newRoasters.length > 0
        ? `<p>This week <strong>${newRoasters.length}</strong> new roaster${newRoasters.length === 1 ? "" : "s"} joined Bean Map:</p>`
        : `<p>Here's your weekly update from Bean Map.</p>`
    }
    <ul>${roasterListHtml}</ul>
    <p>We now have <strong>${totalRoasters}</strong> verified roasters from around the world.</p>
    <p><a href="${appUrl}/roasters">Browse all roasters →</a></p>
    <hr />
    <p style="color: #888; font-size: 12px;">
      You're receiving this because you subscribed to the Bean Map newsletter.
    </p>
  `;

  // Fetch all subscribers (no confirmedAt filter for now — double opt-in not yet implemented)
  const subscribers = await db.newsletterSubscriber.findMany({
    select: { email: true },
  });

  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    const ok = await send({ to: sub.email, subject, html });
    if (ok) sent++;
    else failed++;
  }

  console.log(
    `[newsletter-digest] Sent: ${sent}, Failed: ${failed}, Total subscribers: ${subscribers.length}`,
  );

  return { sent, failed };
}
