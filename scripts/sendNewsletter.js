// scripts/sendNewsletter.js
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import YAML from "yaml";
import { Resend } from "resend";
import { buildNewsletterHtml } from "./buildNewsletterHtml.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  const segmentId = process.env.RESEND_SEGMENT_ID;

  if (!apiKey) {
    console.error("Missing RESEND_API_KEY environment variable");
    process.exit(1);
  }
  if (!segmentId) {
    console.error("Missing RESEND_SEGMENT_ID environment variable");
    process.exit(1);
  }

  const resend = new Resend(apiKey);

  // 1) Load YAML
  const dataDir = path.join(__dirname, "..", "data");
  const todayPath = path.join(dataDir, "today.yaml");

  console.log("Reading YAML:", todayPath);
  const yamlText = await fs.readFile(todayPath, "utf8");
  const newsletter = YAML.parse(yamlText);

  if (!newsletter || !newsletter.articles || newsletter.articles.length === 0) {
    console.error("today.yaml has no articles; aborting send.");
    process.exit(1);
  }

  // 2) Build HTML
  const html = buildNewsletterHtml(newsletter.articles);
  const subject = newsletter.subject || "Your Tech Digest";

  // 3) Create broadcast to the segment
  console.log(
    `Creating broadcast for segment ${segmentId} with ${newsletter.articles.length} article(s)…`
  );

  const { data: created, error: createErr } = await resend.broadcasts.create({
    segmentId,
    from: "news@jfetnews.net",
    subject,
    html,
    name: `JFET digest ${newsletter.date || new Date().toISOString().slice(0, 10)}`,
  });

  if (createErr) {
    console.error("Error creating broadcast:", createErr);
    process.exit(1);
  }

  const broadcastId = created?.id;
  if (!broadcastId) {
    console.error("Broadcast created but no id returned:", created);
    process.exit(1);
  }

  // 4) Send broadcast
  console.log(`Sending broadcast ${broadcastId}…`);
  const { data: sent, error: sendErr } = await resend.broadcasts.send(broadcastId);

  if (sendErr) {
    console.error("Error sending broadcast:", sendErr);
    process.exit(1);
  }

  console.log("✅ Broadcast sent:", sent);

  // 5) Archive YAML
  const archiveDir = path.join(dataDir, "archive");
  await fs.mkdir(archiveDir, { recursive: true });

  const dateStr = newsletter.date || new Date().toISOString().slice(0, 10);
  const archivePath = path.join(archiveDir, `${dateStr}.yaml`);

  await fs.copyFile(todayPath, archivePath);
  console.log(`Archived today.yaml to ${archivePath}`);
}

main().catch((err) => {
  console.error("sendNewsletter failed:", err);
  process.exit(1);
});
