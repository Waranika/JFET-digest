// scripts/prepareYaml.js
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import YAML from "yaml";
import { fetchArticles } from "./fetchArticles.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // 1. Fetch raw articles
  console.log("Preparing YAML: fetching articles…");
  const rawArticles = await fetchArticles(1); // 2 per feed, then we'll slice

  // 2. Take top N overall (e.g. 15 to account for duplicates)
  const maxArticles = 25;
  const articles = rawArticles.slice(0, maxArticles);

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

  const newsletter = {
    date: dateStr,
    subject: "Your Tech Digest",
    intro:
      "Curated news on AI, robotics, chips and engineering. Feel free to tweak this intro in data/today.yaml.",
    articles,
  };

  // 3. Ensure data folders exist
  const dataDir = path.join(__dirname, "..", "data");
  await fs.mkdir(dataDir, { recursive: true });

  const todayPath = path.join(dataDir, "today.yaml");

  // 4. Write YAML
  const yamlText = YAML.stringify(newsletter);
  await fs.writeFile(todayPath, yamlText, "utf8");

  console.log(`Wrote ${todayPath} with ${articles.length} article(s).`);
}

main().catch((err) => {
  console.error("prepareYaml failed:", err);
  process.exit(1);
});
