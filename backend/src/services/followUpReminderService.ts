import { Resend } from "resend";
import { config } from "../config/env";
import { Lead } from "../models/Lead";
import { ReminderDelivery } from "../models/ReminderDelivery";

const resend = config.RESEND_API_KEY ? new Resend(config.RESEND_API_KEY) : null;
const reminderStatuses = { $nin: ["Converted", "Lost"] };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

export async function sendFollowUpReminders(now = new Date()) {
  if (!resend || !config.REMINDER_FROM_EMAIL) return;

  await ReminderDelivery.init();
  const date = now.toISOString().slice(0, 10);
  const endOfToday = new Date(`${date}T23:59:59.999Z`);
  const leads = await Lead.find({
    followUpDate: { $ne: null, $lte: endOfToday },
    status: reminderStatuses,
  }).populate("owner", "name email");

  const leadsByOwner = new Map<string, { owner: { name: string; email: string }; leads: typeof leads }>();
  for (const lead of leads) {
    if (!lead.owner || typeof lead.owner !== "object" || !("email" in lead.owner)) continue;
    const owner = lead.owner as unknown as { _id: { toString(): string }; name: string; email: string };
    const key = owner._id.toString();
    const entry = leadsByOwner.get(key) ?? { owner, leads: [] };
    entry.leads.push(lead);
    leadsByOwner.set(key, entry);
  }

  for (const [ownerId, entry] of leadsByOwner) {
    let claimed = false;
    try {
      await ReminderDelivery.create({ owner: ownerId, date, claimedAt: now });
      claimed = true;
    } catch (error) {
      if (!(typeof error === "object" && error !== null && "code" in error && error.code === 11000)) throw error;
      const staleClaim = new Date(now.getTime() - 60 * 60 * 1000);
      const recovered = await ReminderDelivery.findOneAndUpdate(
        { owner: ownerId, date, sentAt: null, claimedAt: { $lte: staleClaim } },
        { $set: { claimedAt: now } },
        { new: true },
      );
      claimed = Boolean(recovered);
    }
    if (!claimed) continue;

    const leadRows = entry.leads.map((lead) => {
      const due = lead.followUpDate?.toISOString().slice(0, 10) ?? "";
      const label = due < date ? `Overdue · ${due}` : `Due today · ${due}`;
      return `<li><strong>${escapeHtml(lead.name)}</strong> — ${escapeHtml(lead.company || lead.email)} <span>(${label})</span></li>`;
    }).join("");

    try {
      const { error } = await resend.emails.send({
        from: config.REMINDER_FROM_EMAIL,
        to: entry.owner.email,
        subject: `Lead follow-ups for ${date} (${entry.leads.length})`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033"><h2>Your lead follow-ups</h2><p>Hi ${escapeHtml(entry.owner.name)}, these leads are due for follow-up:</p><ul>${leadRows}</ul><p><a href="${escapeHtml(config.CLIENT_URL)}">Open your lead workspace</a></p></div>`,
      });
      if (error) throw new Error(`Resend failed: ${error.message}`);
    } catch (error) {
      await ReminderDelivery.deleteOne({ owner: ownerId, date });
      throw error;
    }

    await ReminderDelivery.updateOne(
      { owner: ownerId, date },
      { $set: { sentAt: new Date() } },
    );
  }
}

export function startFollowUpReminderScheduler() {
  if (!resend || !config.REMINDER_FROM_EMAIL) {
    console.info("Follow-up email reminders are disabled; configure RESEND_API_KEY and REMINDER_FROM_EMAIL to enable them.");
    return;
  }

  const run = () => sendFollowUpReminders().catch((error: unknown) => {
    console.error("Unable to send follow-up reminders:", error);
  });
  void run();
  const timer = setInterval(() => void run(), 15 * 60 * 1000);
  timer.unref();
}
