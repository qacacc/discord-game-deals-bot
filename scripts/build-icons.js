const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const icons = [
  {
    name: "free",
    url: "https://fonts.gstatic.com/s/i/materialicons/card_giftcard/v12/24px.svg",
  },
  {
    name: "sale",
    url: "https://fonts.gstatic.com/s/i/materialicons/local_offer/v14/24px.svg",
  },
  {
    name: "event",
    url: "https://fonts.gstatic.com/s/i/materialicons/event/v15/24px.svg",
  },
  {
    name: "steam",
    url: "https://cdn.simpleicons.org/steam/ffffff",
  },
  {
    name: "epic",
    url: "https://cdn.simpleicons.org/epicgames/ffffff",
  },
  {
    name: "gog",
    url: "https://cdn.simpleicons.org/gogdotcom/ffffff",
  },
];

async function downloadIcon(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Tai icon that bai: ${url}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const outputDir = path.join(__dirname, "..", "src", "assets", "icons");
  await fs.mkdir(outputDir, { recursive: true });

  for (const icon of icons) {
    const svg = await downloadIcon(icon.url);
    const outputPath = path.join(outputDir, `${icon.name}.png`);

    await sharp(svg)
      .resize(96, 96, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(outputPath);

    console.log(`Built ${outputPath}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
