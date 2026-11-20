import type { ProjectSettings, ScoredLead } from "./types";

function firstName(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? "";
  return first && first.toLowerCase() !== "unnamed" ? first : "there";
}

/** A short, polite first message. The agent edits it before sending. */
export function draftMessage(scored: ScoredLead, settings: ProjectSettings): string {
  const who = settings.agentName.trim();
  const project = settings.projectName.trim() || "our project";
  const hello = `Hi ${firstName(scored.lead.name)}, ${who ? `this is ${who} from ${project}` : `thanks for your interest in ${project}`}.`;
  const wants = scored.lead.config.trim() ? ` You asked about a ${scored.lead.config.trim()}.` : "";

  if (scored.lead.status === "no_answer") {
    return `${hello} I tried calling you just now.${wants} When is a good time to talk for five minutes?`;
  }
  if (scored.bucket === "call_today") {
    return `${hello}${wants} I can share the price sheet and payment plan here. Would you like to visit the site this weekend?`;
  }
  if (scored.bucket === "this_week") {
    return `${hello}${wants} I can send the brochure and price sheet here. Is there a good time for a quick call?`;
  }
  return `${hello}${wants} Sharing the brochure here in case it is useful. Reply any time if you would like prices or a visit.`;
}

export function whatsappLink(digits: string, message: string): string {
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
