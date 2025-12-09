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
  const to = process.env.NEWSLETTER_TO || "kizerboeli@gmail.com";

  if (!apiKey) {
    console.error("Missing RESEND_API_KEY environment variable");
    process.exit(1);
  }

  const resend = new Resend(apiKey);

  // 1. Load YAML
  const dataDir = path.join(__dirname, "..", "data");
  const todayPath = path.join(dataDir, "today.yaml");

  console.log("Reading YAML:", todayPath);
  const yamlText = await fs.readFile(todayPath, "utf8");
  const newsletter = YAML.parse(yamlText);

  if (!newsletter || !newsletter.articles || newsletter.articles.length === 0) {
    console.error("today.yaml has no articles; aborting send.");
    process.exit(1);
  }

  // 2. Build HTML
  const html = buildNewsletterHtml(newsletter);
  const subject = newsletter.subject || "Your Tech Digest";

  // 3. Send email
  console.log(
    `Sending newsletter to ${to} with ${newsletter.articles.length} article(s)…`
  );

  const { data, error } = await resend.emails.send({
    from: "news@jfetnews.net",
    to,
    subject,
    html,
  });

  if (error) {
    console.error("Error sending email:", error);
    process.exit(1);
  }

  console.log("Email sent:", data);

  // 4. Archive YAML
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
