import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";

await loadLocalEnv();

const API_BASE_URL = process.env.MHW_API_BASE_URL || "https://mhw-db.com";
const FANDOM_API_URL =
  process.env.MHW_ICON_API_URL || "https://monsterhunterworld-archive.fandom.com/api.php";
const FALLBACK_ICON_API_URL = "https://monsterhunter.fandom.com/api.php";
const FALLBACK_ICON_TITLES = [
  "File:MHWI-Safi'jiiva Icon.png",
  "File:MHWI-Stygian Zinogre Icon.png",
];
const OUT_FILE = resolve("src/data/monsters.json");
const ICON_DIR = resolve("public/monster-icons");

async function main() {
  const monsters = await getJson(`${API_BASE_URL}/monsters`);
  const icons = await getMonsterIcons();
  const cachedAt = new Date().toISOString();

  const payload = {
    source: `${API_BASE_URL}/monsters`,
    cachedAt,
    count: monsters.length,
    monsters: monsters
      .map((monster) => normalizeMonster(monster, icons))
      .sort((left, right) => left.name.localeCompare(right.name)),
  };

  await mkdir(dirname(OUT_FILE), { recursive: true });
  await writeFile(`${OUT_FILE}`, `${JSON.stringify(payload, null, 2)}\n`);

  console.log(`Cached ${payload.count} monsters to ${OUT_FILE}`);
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": userAgent(),
    },
  });

  if (!response.ok) {
    throw new Error(`MHW DB request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function loadLocalEnv() {
  try {
    const contents = await readFile(resolve(".env"), "utf8");

    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]]) continue;

      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function userAgent() {
  const contact = process.env.MHW_CACHE_USER_AGENT_CONTACT;
  return contact ? `mhw-field-guide-cache/0.1 (${contact})` : "mhw-field-guide-cache/0.1";
}

async function getMonsterIcons() {
  const params = new URLSearchParams({
    action: "query",
    list: "categorymembers",
    cmtitle: "Category:Monster_Icons",
    cmtype: "file",
    cmlimit: "500",
    format: "json",
  });
  const category = await getJson(`${FANDOM_API_URL}?${params.toString()}`);
  const titles = category.query.categorymembers.map((member) => member.title);
  const pages = [];

  for (const titleBatch of chunk(titles, 40)) {
    const imageInfoParams = new URLSearchParams({
      action: "query",
      prop: "imageinfo",
      iiprop: "url",
      titles: titleBatch.join("|"),
      format: "json",
    });
    const imageInfo = await getJson(`${FANDOM_API_URL}?${imageInfoParams.toString()}`);
    pages.push(...Object.values(imageInfo.query.pages));
  }

  await mkdir(ICON_DIR, { recursive: true });

  const icons = new Map();
  for (const page of pages) {
    const name = monsterNameFromTitle(page.title);
    const url = page.imageinfo?.[0]?.url;
    if (!name || !url) continue;

    const slug = slugify(name);
    const extension = extname(new URL(url).pathname) || ".png";
    const fileName = `${slug}${extension}`;
    const outputPath = resolve(ICON_DIR, fileName);
    const downloaded = await downloadFile(url, outputPath);
    if (downloaded) {
      icons.set(slug, `/monster-icons/${fileName}`);
    }
  }

  for (const page of await getImageInfoPages(FALLBACK_ICON_API_URL, FALLBACK_ICON_TITLES)) {
    const name = monsterNameFromTitle(page.title);
    const url = page.imageinfo?.[0]?.url;
    if (!name || !url) continue;

    const slug = slugify(name);
    const extension = extname(new URL(url).pathname) || ".png";
    const fileName = `${slug}${extension}`;
    const outputPath = resolve(ICON_DIR, fileName);
    const downloaded = await downloadFile(url, outputPath);
    if (downloaded) {
      icons.set(slug, `/monster-icons/${fileName}`);
    }
  }

  return icons;
}

async function getImageInfoPages(apiUrl, titles) {
  const pages = [];

  for (const titleBatch of chunk(titles, 40)) {
    const imageInfoParams = new URLSearchParams({
      action: "query",
      prop: "imageinfo",
      iiprop: "url",
      titles: titleBatch.join("|"),
      format: "json",
    });
    const imageInfo = await getJson(`${apiUrl}?${imageInfoParams.toString()}`);
    pages.push(...Object.values(imageInfo.query.pages));
  }

  return pages;
}

async function downloadFile(url, outputPath) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": userAgent(),
      },
    });

    if (response.ok) {
      const bytes = new Uint8Array(await response.arrayBuffer());
      await writeFile(outputPath, bytes);
      return true;
    }

    if (attempt === 4) {
      console.warn(`Skipping icon after ${attempt} attempts: ${response.status} ${response.statusText} ${url}`);
      return false;
    }

    await delay(attempt * 650);
  }
}

function normalizeMonster(monster, icons) {
  return {
    id: monster.id,
    name: monster.name,
    icon: icons.get(slugify(monster.name)) || null,
    type: monster.type,
    species: monster.species,
    description: monster.description,
    elements: monster.elements ?? [],
    ailments: monster.ailments ?? [],
    locations: monster.locations ?? [],
    resistances: monster.resistances ?? [],
    weaknesses: monster.weaknesses ?? [],
    rewards: monster.rewards ?? [],
  };
}

function monsterNameFromTitle(title) {
  return title
    .replace(/^File:/, "")
    .replace(/\.[^.]+$/, "")
    .replace(/^MHW[I]?[-\s]+/, "")
    .replace(/\s+Icon$/, "")
    .trim();
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
