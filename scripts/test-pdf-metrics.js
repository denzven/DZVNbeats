import { jsPDF } from "jspdf";
import fs from "fs";

const doc = new jsPDF({
  orientation: "portrait",
  unit: "mm",
  format: "a4",
});

const pageWidth = 210;
const margin = 15;
const contentWidth = pageWidth - margin * 2;

// Page 1
doc.setFillColor(12, 12, 16);
doc.rect(0, 0, pageWidth, 28, "F");
doc.setDrawColor(212, 175, 55);
doc.setLineWidth(0.6);
doc.line(0, 28, pageWidth, 28);

// Banner
let y = 33;
doc.setFillColor(246, 246, 249);
doc.setDrawColor(215, 215, 225);
doc.setLineWidth(0.4);
doc.roundedRect(margin, y, contentWidth, 16, 2, 2, "FD");

doc.setFont("helvetica", "bold");
doc.setFontSize(9.5);
doc.setTextColor(15, 15, 20);
doc.text("STUDIO LICENSE DEAL MEMO: EXCLUSIVE CONTRACT", margin + 5, y + 6.5);

doc.setFont("helvetica", "normal");
doc.setFontSize(7);
doc.setTextColor(90, 95, 105);
doc.text("Binding electronic agreement under Section 10A, Information Technology Act, 2000.", margin + 5, y + 11.5);

const pillW = 42;
const pillH = 8.5;
const pillX = margin + contentWidth - pillW - 4;
const pillY = y + 3.75;
doc.setFillColor(15, 15, 20);
doc.setDrawColor(212, 175, 55);
doc.setLineWidth(0.4);
doc.roundedRect(pillX, pillY, pillW, pillH, 1.5, 1.5, "FD");

doc.setFont("helvetica", "bold");
doc.setFontSize(7.5);
doc.setTextColor(220, 180, 50);
doc.text("FEE: INR 1,000", pillX + pillW / 2, pillY + 5.5, { align: "center" });

// Page 1 Footer
const footerY = 282;
doc.setFillColor(12, 12, 16);
doc.rect(0, footerY, pageWidth, 15, "F");
doc.setDrawColor(212, 175, 55);
doc.setLineWidth(0.5);
doc.line(0, footerY, pageWidth, footerY);

doc.setFont("helvetica", "normal");
doc.setFontSize(6.5);
doc.setTextColor(165, 165, 175);
doc.text(
  "DZVNbeats Studio • Page 1 of 2 • Official Deal Memorandum & License Certificate • https://dzvnbeats.com/licensing",
  pageWidth / 2,
  footerY + 6.5,
  { align: "center" }
);

// Page 2
doc.addPage();
doc.setFillColor(12, 12, 16);
doc.rect(0, 0, pageWidth, 20, "F");
doc.setDrawColor(212, 175, 55);
doc.setLineWidth(0.6);
doc.line(0, 20, pageWidth, 20);

// Page 2 Footer
doc.setFillColor(12, 12, 16);
doc.rect(0, footerY, pageWidth, 15, "F");
doc.setDrawColor(212, 175, 55);
doc.setLineWidth(0.5);
doc.line(0, footerY, pageWidth, footerY);

doc.setFont("helvetica", "normal");
doc.setFontSize(6.5);
doc.setTextColor(165, 165, 175);
doc.text(
  "DZVNbeats Studio • Page 2 of 2 • Binding Legal Covenants • Mumbai Courts Jurisdiction • https://dzvnbeats.com/licensing",
  pageWidth / 2,
  footerY + 6.5,
  { align: "center" }
);

const out = doc.output("arraybuffer");
fs.writeFileSync("scripts/test-output.pdf", Buffer.from(out));
console.log("Generated test-output.pdf successfully!", out.byteLength, "bytes");
