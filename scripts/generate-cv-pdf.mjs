import PDFDocument from "pdfkit";
import { cvContent } from "./cv-content.mjs";
import fs from "node:fs";
import path from "node:path";

const {
  profile,
  links,
  experience,
  education,
  stack,
  profileHighlights,
  services,
} = cvContent;

const outPath = path.join(process.cwd(), "public", "cv.pdf");
fs.mkdirSync(path.dirname(outPath), { recursive: true });

const doc = new PDFDocument({
  size: "A4",
  margin: 0,
  info: {
    Title: `${profile.name} CV`,
    Author: profile.name,
  },
});

doc.pipe(fs.createWriteStream(outPath));

const W = doc.page.width;
const H = doc.page.height;

const railW = 202;
const railPad = 22;
const railX = railPad;
const railW2 = railW - railPad * 2;

const M = 38;
const mainX = railW + 26;
const mainW = W - mainX - M;

const c = {
  ink: "#17140f",
  text: "#3a342c",
  muted: "#6b6357",
  soft: "#8a8072",
  accent: "#d9531e",
  accentBright: "#ff6a2c",
  pine: "#1c6b56",
  rule: "#e4dfd3",
  raise: "#f6f3ea",
  chip: "#f1ede2",
  chipBorder: "#ded9cb",
  onDark: "#ece5d7",
  onDarkMuted: "#a49a89",
  darkChip: "#252019",
  darkChipBorder: "#3c352b",
};

function text(value, x, y, o = {}) {
  const {
    size = 9.4,
    font = "Helvetica",
    fill = c.text,
    width,
    lineGap = 1.6,
    align,
    characterSpacing = 0,
  } = o;
  doc
    .fillColor(fill)
    .font(font)
    .fontSize(size)
    .text(value, x, y, { width, lineGap, align, characterSpacing });
}

function h(value, width, o = {}) {
  const { size = 9.4, font = "Helvetica", lineGap = 1.6 } = o;
  return doc.font(font).fontSize(size).heightOfString(value, { width, lineGap });
}

function mono(label, x, y, width, fill, size = 7.4) {
  text(label.toUpperCase(), x, y, {
    size,
    font: "Courier-Bold",
    fill,
    width,
    characterSpacing: 1.5,
  });
}

function railSection(label, y) {
  mono(label, railX, y, railW2, c.accentBright);
  doc
    .moveTo(railX, y + 12)
    .lineTo(railX + railW2, y + 12)
    .lineWidth(0.7)
    .strokeColor(c.darkChipBorder)
    .stroke();
  return y + 22;
}

function mainSection(label, y) {
  mono(label, mainX, y, mainW, c.accent);
  doc
    .moveTo(mainX, y + 12)
    .lineTo(mainX + mainW, y + 12)
    .lineWidth(0.8)
    .strokeColor(c.rule)
    .stroke();
  return y + 23;
}

function chip(label, x, y, maxW, dark) {
  doc.font("Courier-Bold").fontSize(7);
  const w = Math.min(doc.widthOfString(label) + 14, maxW);
  doc.roundedRect(x, y, w, 15, 3.5).fillColor(dark ? c.darkChip : c.chip).fill();
  doc
    .roundedRect(x, y, w, 15, 3.5)
    .lineWidth(0.7)
    .strokeColor(dark ? c.darkChipBorder : c.chipBorder)
    .stroke();
  text(label, x + 7, y + 4.2, {
    size: 7,
    font: "Courier-Bold",
    fill: dark ? c.onDark : c.text,
    width: w - 14,
    align: "center",
  });
  return w;
}

function chips(items, x, y, width, dark) {
  let cx = x;
  let cy = y;
  items.forEach((item) => {
    doc.font("Courier-Bold").fontSize(7);
    const w = Math.min(doc.widthOfString(item) + 14, width);
    if (cx + w > x + width) {
      cx = x;
      cy += 20;
    }
    chip(item, cx, cy, width, dark);
    cx += w + 5;
  });
  return cy + 20;
}

/* ---------- LEFT RAIL (dark, full height) ---------- */
doc.rect(0, 0, railW, H).fill(c.ink);
doc.rect(railW, 0, 3, H).fill(c.accent);

let ry = 40;
text(profile.name, railX, ry, {
  size: 21,
  font: "Helvetica-Bold",
  fill: "#ffffff",
  width: railW2,
  lineGap: 1,
});
ry += h(profile.name, railW2, { size: 21, lineGap: 1 }) + 6;
mono(profile.role, railX, ry, railW2, c.accentBright, 7.8);
ry += 26;

ry = railSection("Contact", ry);
[
  ["Email", profile.email],
  ["Phone", profile.phone],
  ["Location", profile.location],
].forEach(([label, value]) => {
  mono(label, railX, ry, railW2, c.onDarkMuted, 6.6);
  text(value, railX, ry + 8.5, {
    size: 8,
    font: "Helvetica-Bold",
    fill: c.onDark,
    width: railW2,
    lineGap: 1.4,
  });
  ry += 10 + h(value, railW2, { size: 8, lineGap: 1.4 }) + 8;
});

ry += 6;
ry = railSection("Strengths", ry);
profileHighlights.forEach(([title, body]) => {
  text(title, railX, ry, {
    size: 8.7,
    font: "Helvetica-Bold",
    fill: c.onDark,
    width: railW2,
  });
  text(body, railX, ry + 11.5, {
    size: 7.3,
    fill: c.onDarkMuted,
    width: railW2,
    lineGap: 1.3,
  });
  ry += 15 + h(body, railW2, { size: 7.3, lineGap: 1.3 }) + 8;
});

ry += 6;
ry = railSection("Toolkit", ry);
ry = chips(stack, railX, ry, railW2, true);

ry += 12;
ry = railSection("Links", ry);
links.forEach(([label, value]) => {
  mono(label, railX, ry, railW2, c.onDarkMuted, 6.6);
  text(value, railX, ry + 8.5, {
    size: 7.8,
    font: "Helvetica-Bold",
    fill: c.onDark,
    width: railW2,
    lineGap: 1.3,
  });
  ry += 10 + h(value, railW2, { size: 7.8, lineGap: 1.3 }) + 8;
});

/* ---------- RIGHT MAIN (profile, experience, education, services) ---------- */
let y = 40;

y = mainSection("Profile", y);
text(profile.about, mainX, y, {
  size: 9.4,
  fill: c.text,
  width: mainW,
  lineGap: 2.3,
});
y += h(profile.about, mainW, { size: 9.4, lineGap: 2.3 }) + 18;

y = mainSection("Experience", y);
const lineX = mainX + 3;
const expStartY = y;
experience.forEach(([role, company, period, location, summary], i) => {
  const dotY = y + 4;
  doc.circle(lineX, dotY, 3).fill(i === 0 ? c.accent : c.soft);
  const tx = mainX + 16;
  const tw = mainW - 16;
  text(role, tx, y, {
    size: 10.4,
    font: "Helvetica-Bold",
    fill: c.ink,
    width: tw,
  });
  text(company, tx, y + 14.5, {
    size: 8.6,
    font: "Helvetica-Bold",
    fill: c.accent,
    width: tw,
  });

  const loc = location.replace(/,\s*Pakistan/i, "").replace(/\s-\s/, " · ");
  const metaText = `${period}  ·  ${loc}`.toUpperCase();
  const metaCS = 0.6;
  const metaSize = 6.6;
  doc.font("Courier-Bold").fontSize(metaSize);
  const metaW =
    doc.widthOfString(metaText) + metaCS * Math.max(0, metaText.length - 1);
  const metaLines = metaW > tw ? 2 : 1;
  text(metaText, tx, y + 27, {
    size: metaSize,
    font: "Courier-Bold",
    fill: c.soft,
    width: tw,
    characterSpacing: metaCS,
    lineGap: 2.5,
  });

  const sumY = y + 27 + metaLines * 9 + 5;
  text(summary, tx, sumY, {
    size: 8.8,
    fill: c.text,
    width: tw,
    lineGap: 1.9,
  });
  y = sumY + h(summary, tw, { size: 8.8, lineGap: 1.9 }) + 13;
});
doc
  .moveTo(lineX, expStartY + 4)
  .lineTo(lineX, y - 14)
  .lineWidth(1)
  .strokeColor(c.rule)
  .stroke();

y += 2;
y = mainSection("Education", y);
education.forEach(([school, degree, period, focus]) => {
  text(school, mainX, y, {
    size: 9.6,
    font: "Helvetica-Bold",
    fill: c.ink,
    width: mainW,
  });
  text(degree, mainX, y + 14, { size: 8.4, fill: c.text, width: mainW });
  mono(period, mainX, y + 27, mainW, c.accent);
  y += 40;
  if (Array.isArray(focus)) {
    y = chips(focus, mainX, y, mainW, false) + 2;
  }
});

y += 8;
y = mainSection("Services", y);
services.forEach(([title, body]) => {
  doc.circle(mainX + 2.5, y + 4.5, 2).fill(c.pine);
  text(title, mainX + 11, y, {
    size: 8.9,
    font: "Helvetica-Bold",
    fill: c.ink,
    width: mainW - 11,
  });
  text(body, mainX + 11, y + 11.5, {
    size: 7.7,
    fill: c.muted,
    width: mainW - 11,
    lineGap: 1.3,
  });
  y += 15 + h(body, mainW - 11, { size: 7.7, lineGap: 1.3 }) + 7;
});

/* availability badge pinned to rail bottom */
const badgeY = H - 58;
doc
  .moveTo(railX, badgeY - 14)
  .lineTo(railX + railW2, badgeY - 14)
  .lineWidth(0.7)
  .strokeColor(c.darkChipBorder)
  .stroke();
doc.circle(railX + 3, badgeY + 3.5, 3).fill(c.pine);
mono("Available for", railX + 12, badgeY, railW2 - 12, c.onDarkMuted, 6.6);
mono("product builds", railX + 12, badgeY + 8.5, railW2 - 12, c.onDark, 7.2);

doc.end();
doc.on("finish", () => process.stdout.write(`Wrote ${outPath}\n`));
