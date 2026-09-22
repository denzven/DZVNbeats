import { jsPDF } from "jspdf";

export interface CustomContractOptions {
  artistName: string;
  beatTitle: string;
  tierName: "Free (Tagged)" | "Basic Lease" | "Exclusive Contract";
  transactionId?: string;
  date?: string;
}

export async function generateCustomContractPdf(options: CustomContractOptions) {
  const {
    artistName,
    beatTitle,
    tierName,
    transactionId = "UPI-DIGITAL-CONFIRMATION",
    date = new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  } = options;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // 180mm

  const isExclusive = tierName === "Exclusive Contract";
  const isBasic = tierName === "Basic Lease";

  const priceBadge = isExclusive
    ? "FEE: INR 1,000"
    : isBasic
    ? "FEE: INR 200"
    : "FREE LICENSE";

  const priceText = isExclusive
    ? "INR 1,000 (PAID)"
    : isBasic
    ? "INR 200 (PAID)"
    : "INR 0 (FREE)";

  const streamCap = isExclusive
    ? "UNLIMITED Commercial Audio Streams"
    : isBasic
    ? "Up to 50,000 Streams across DSPs (Spotify, Apple Music)"
    : "0 Commercial Streams (Non-profit & Audition Only)";

  const audioFormat = isExclusive
    ? "Untagged Master WAV + Full Track Stems (Multi-tracks)"
    : isBasic
    ? "Untagged High-Quality Master WAV (24-bit / 44.1kHz)"
    : "High-Quality Master WAV (Voice Tagged)";

  const ytRights = isExclusive
    ? "UNLIMITED Monetized Videos & Channels"
    : isBasic
    ? "Allowed on 1 Official Monetized YouTube Video"
    : "Strictly Prohibited (Unmonetized videos only)";

  const stems = isExclusive
    ? "Included (Full Separated Drum, Bass, Melody & FX Stems)"
    : "Not Included (Master WAV only)";

  const contentId = isExclusive
    ? "Permitted for Exclusive Licensee"
    : "Strictly Prohibited (Violators face DMCA / Copyright Strike)";

  const recoupmentText = isExclusive
    ? "Culture-First Guarantee: Artist keeps 100% of first INR 2,000 earned"
    : isBasic
    ? "Artist keeps 100% of revenue within 50,000 streams"
    : "N/A (Strictly non-commercial)";

  const netRoyaltyText = isExclusive
    ? "20% Net Master Royalty on gross revenues exceeding INR 2,000"
    : isBasic
    ? "0% Backend (Upgrade to Exclusive required above 50k streams)"
    : "N/A (Monetization strictly prohibited)";

  // =========================================================================
  // PAGE 1: EXECUTIVE LICENSE CERTIFICATE & DEAL MEMORANDUM
  // =========================================================================

  // Top Dark Header Bar
  doc.setFillColor(12, 12, 16);
  doc.rect(0, 0, pageWidth, 28, "F");

  // Gold accent rule
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.6);
  doc.line(0, 28, pageWidth, 28);

  // Attempt to load logo from URL
  try {
    const logoImg = new Image();
    logoImg.src = "/DZVNbeats_pfp.jpeg";
    await new Promise((resolve) => {
      logoImg.onload = resolve;
      logoImg.onerror = resolve;
    });
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      doc.addImage(logoImg, "JPEG", margin, 3, 22, 22);
    }
  } catch (e) {
    console.warn("Logo embed skipped:", e);
  }

  // Header Typography
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("DZVNBEATS • OFFICIAL STUDIO CONTRACT", margin + 27, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(185, 185, 195);
  doc.text(
    "Licensor: Denzven Vadakkan (p/k/a DZVN) • Mumbai, Maharashtra, India",
    margin + 27,
    17
  );
  doc.text(
    "Governing Law: Indian Copyright Act 1957 • Indian Contract Act 1872 • IT Act 2000",
    margin + 27,
    22.5
  );

  // Document Title Banner & Price Badge
  let y = 33;
  doc.setFillColor(246, 246, 249);
  doc.setDrawColor(215, 215, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, "FD");

  // Title on Left
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 15, 20);
  doc.text(
    `STUDIO LICENSE AGREEMENT: ${tierName.toUpperCase()}`,
    margin + 5,
    y + 6.5
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(90, 95, 105);
  doc.text(
    `Contract Executed on: ${date} • Ref ID: ${transactionId} • IT Act 2000 Binding`,
    margin + 5,
    y + 11.5
  );

  // Dedicated Price Pill on Right (Fits neatly without overflowing)
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
  doc.setTextColor(220, 180, 50); // Gold
  doc.text(priceBadge, pillX + pillW / 2, pillY + 5.5, {
    align: "center",
  });

  // Section 1: Parties & Deliverables (2 Column Cards)
  y += 20;
  const colWidth = (contentWidth - 6) / 2; // 87mm

  const drawField = (
    label: string,
    val: string,
    x: number,
    yPos: number,
    maxW: number,
    highlight = false
  ) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(100, 105, 115);
    doc.text(label, x, yPos);

    doc.setFont("helvetica", highlight ? "bold" : "normal");
    doc.setFontSize(7);
    doc.setTextColor(highlight ? 180 : 30, highlight ? 120 : 35, highlight ? 20 : 45);
    const wrapped = doc.splitTextToSize(val, maxW);
    doc.text(wrapped, x + 24, yPos);
  };

  // Left Card: Parties & Origin
  doc.setFillColor(252, 252, 254);
  doc.setDrawColor(225, 225, 235);
  doc.roundedRect(margin, y, colWidth, 34, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 30);
  doc.text("PARTIES & IDENTIFICATION", margin + 5, y + 5.5);
  doc.setDrawColor(230, 230, 240);
  doc.line(margin + 5, y + 7.5, margin + colWidth - 5, y + 7.5);

  drawField("LICENSOR:", "Denzven Vadakkan (DZVN)", margin + 5, y + 12.5, colWidth - 32);
  drawField("LICENSEE:", artistName || "Verified Artist", margin + 5, y + 18, colWidth - 32);
  drawField("BEAT WORK:", `"${beatTitle || "Studio Beat Master"}"`, margin + 5, y + 23.5, colWidth - 32, true);
  drawField("LOCATION:", "Mumbai, Maharashtra, India", margin + 5, y + 29, colWidth - 32);

  // Right Card: Scope & Deliverables
  const col2X = margin + colWidth + 6;
  doc.setFillColor(252, 252, 254);
  doc.setDrawColor(225, 225, 235);
  doc.roundedRect(col2X, y, colWidth, 34, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 30);
  doc.text("DELIVERABLES & SCOPE", col2X + 5, y + 5.5);
  doc.setDrawColor(230, 230, 240);
  doc.line(col2X + 5, y + 7.5, col2X + colWidth - 5, y + 7.5);

  drawField("FORMAT:", audioFormat, col2X + 5, y + 12.5, colWidth - 32);
  drawField("MULTI-TRACKS:", stems, col2X + 5, y + 18, colWidth - 32);
  drawField("STREAM CAP:", streamCap, col2X + 5, y + 23.5, colWidth - 32);
  drawField("YOUTUBE:", ytRights, col2X + 5, y + 29, colWidth - 32);

  // Section 2: Commercial Rights Matrix (Table Box)
  y += 38;
  doc.setFillColor(248, 249, 251);
  doc.setDrawColor(220, 223, 230);
  doc.roundedRect(margin, y, contentWidth, 36, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 30);
  doc.text("COMMERCIAL EXPLOITATION & RESTRICTIONS MATRIX", margin + 6, y + 5.5);
  doc.setDrawColor(225, 225, 235);
  doc.line(margin + 6, y + 7.5, margin + contentWidth - 6, y + 7.5);

  const matrixLeft = margin + 6;
  const matrixRight = margin + contentWidth / 2 + 3;
  const matrixValW = contentWidth / 2 - 34;

  let my = y + 13;
  drawField(
    "DISTRIBUTION:",
    isExclusive ? "UNLIMITED Copies" : isBasic ? "Up to 500 Physical/Digital Copies" : "0 Commercial Copies",
    matrixLeft,
    my,
    matrixValW
  );
  drawField(
    "RADIO AIRPLAY:",
    isExclusive ? "Permitted (Commercial)" : "Excluded",
    matrixRight,
    my,
    matrixValW
  );

  my += 5.5;
  drawField("CONTENT ID:", contentId, matrixLeft, my, matrixValW, contentId.includes("Prohibited"));
  drawField(
    "EXCLUSIVITY:",
    isExclusive ? "Beat Retired from Store" : "Non-Exclusive Lease",
    matrixRight,
    my,
    matrixValW
  );

  my += 5.5;
  drawField("RECOUPMENT:", recoupmentText, matrixLeft, my, matrixValW);
  drawField("NET ROYALTY:", netRoyaltyText, matrixRight, my, matrixValW);

  my += 5.5;
  drawField("CREDIT RULE:", "Mandatory: (Prod. by DZVN) in all titles", matrixLeft, my, matrixValW, true);
  drawField("PUBLISHING:", "50% Writer / 50% Lyricist (Statutory)", matrixRight, my, matrixValW);

  // Section 3: Culture-First Recoupment Guarantee Box (Gold bordered callout)
  y += 40;
  doc.setFillColor(254, 252, 245);
  doc.setDrawColor(220, 180, 80);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(160, 110, 15);
  doc.text("CULTURE-FIRST RECOUPMENT GUARANTEE (WIN-WIN MODEL)", margin + 6, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(60, 50, 20);
  const recoupmentDesc = isExclusive
    ? `Under this Exclusive Contract, ${artistName || "Artist"} keeps 100% of the first INR 2,000 earned from the song '${beatTitle || "Beat"}' (double the INR 1,000 beat price) to completely recoup recording, mixing, and marketing expenses. Only when cumulative song revenues cross INR 2,000 does the 20% Net Master Streaming Royalty split apply to excess revenues. Writer/Composer publishing remains split 50/50 statutory under the Indian Copyright Act, 1957.`
    : `Under this Basic Lease, ${artistName || "Licensee"} keeps 100% of commercial streaming earnings up to 50,000 streams. If the song reaches 50,000 streams or secures major label/film distribution, upgrading to an Exclusive Contract is required to maintain legal clearance. Composer publishing remains split 50/50 statutory under the Indian Copyright Act, 1957.`;

  const rLines = doc.splitTextToSize(recoupmentDesc, contentWidth - 12);
  doc.text(rLines, margin + 6, y + 10.5);

  // Section 4: Mandatory Credit & Distributor Instructions
  y += 28;
  doc.setFillColor(242, 244, 248);
  doc.setDrawColor(215, 220, 230);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 40, 60);
  doc.text("DISTROKID / TUNECORE / DSP RELEASE INSTRUCTIONS", margin + 6, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.6);
  doc.setTextColor(70, 75, 90);
  const distInstructions = [
    "1. Metadata Attribution: List Producer as 'Denzven Vadakkan (DZVN)' and Composer as 'Denzven Vadakkan'.",
    `2. Title Format: ${beatTitle || "Song Title"} (Prod. by DZVN) — mandatory across YouTube, Spotify, and Apple Music.`,
    "3. Distributor Audit: Upload this 2-page document as your official Beat License Certificate if prompted.",
  ];
  let distY = y + 10;
  distInstructions.forEach((inst) => {
    const lines = doc.splitTextToSize(inst, contentWidth - 12);
    doc.text(lines, margin + 6, distY);
    distY += 3.2;
  });

  // Section 5: Signature & Authentication Block
  y += 24;
  doc.setDrawColor(215, 218, 225);
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;

  // Left Signature: Licensor
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 30);
  doc.text("LICENSOR / PRODUCER:", margin + 4, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(60, 65, 75);
  doc.text("Denzven Vadakkan (p/k/a DZVN / DZVNbeats)", margin + 4, y + 4.5);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.5);
  doc.setTextColor(180, 120, 20);
  doc.text("Digitally Authenticated Studio Master Agreement", margin + 4, y + 8.5);
  doc.text("Mumbai, Maharashtra, Republic of India", margin + 4, y + 12.5);

  // Right Signature: Licensee
  const sigCol2 = margin + contentWidth / 2 + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 30);
  doc.text("LICENSEE / ARTIST:", sigCol2, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(60, 65, 75);
  doc.text(`${artistName || "Verified Licensee"} (Single Master Derivative)`, sigCol2, y + 4.5);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.5);
  doc.setTextColor(70, 75, 85);
  doc.text("Binding Electronic Acceptance (IT Act 2000)", sigCol2, y + 8.5);
  doc.text(`Confirmed via Ref ID: ${transactionId}`, sigCol2, y + 12.5);

  // Page 1 Safe Footer Bar (Positioned at 282mm, extends to 297mm with gold accent line)
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

  // =========================================================================
  // PAGE 2: STANDARD STUDIO COVENANTS & LEGAL TERMS (INDIAN LAW)
  // =========================================================================
  doc.addPage();

  // Page 2 Header (Compact)
  doc.setFillColor(12, 12, 16);
  doc.rect(0, 0, pageWidth, 20, "F");

  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.6);
  doc.line(0, 20, pageWidth, 20);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("DZVNBEATS • STANDARD STUDIO LEGAL COVENANTS", margin, 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(185, 185, 195);
  doc.text(
    "Governed by the Indian Contract Act 1872 & Indian Copyright Act 1957 • Exclusive Jurisdiction: Mumbai, Maharashtra",
    margin,
    15.5
  );

  let p2y = 26;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 15, 20);
  doc.text("CONTRACT TERMS & GENERAL PROVISIONS", margin, p2y);
  doc.setDrawColor(200, 200, 210);
  doc.setLineWidth(0.3);
  doc.line(margin, p2y + 2, margin + contentWidth, p2y + 2);

  p2y += 6;

  const clauses = [
    {
      title: "1. PARTIES & ELECTRONIC FORMATION (IT ACT 2000)",
      text: `This Agreement is entered into between Denzven Vadakkan, operating professionally as DZVN / DZVNbeats ('Licensor'), and ${
        artistName || "Licensee"
      } ('Licensee') for the musical work '${
        beatTitle || "Beat"
      }'. Downloading, receiving audio files, or remitting payment constitutes valid and binding electronic execution under Section 10A of the Information Technology Act, 2000 and the Indian Contract Act, 1872.`,
    },
    {
      title: "2. GRANT OF LICENSE & COMMERCIAL SCOPE",
      text: `Licensor grants Licensee a limited, non-transferable license to synchronize spoken/sung vocals with the beat to create one (1) new derivative sound recording ('New Song'). Permitted commercial scope: ${streamCap}; ${ytRights}. Resale, sub-licensing, or standalone audio distribution of the beat is strictly prohibited.`,
    },
    {
      title: "3. MANDATORY CREDIT ATTRIBUTION & MORAL RIGHTS (SEC 57)",
      text: "Licensee MUST credit 'Produced by DZVN' in all digital release titles, streaming metadata, and video descriptions (e.g., 'Track Title (Prod. by DZVN)'). Licensor retains all statutory moral rights under Section 57 of the Indian Copyright Act, 1957, including the right of paternity and protection against derogatory distortion.",
    },
    {
      title: "4. CULTURE-FIRST RECOUPMENT & ROYALTY SHARING FORMULA",
      text: isExclusive
        ? `RECOUPMENT BUFFER: Licensee retains 100% of the first INR 2,000 earned from the new song '${
            beatTitle || "Beat"
          }' to fully recoup recording, mixing, and marketing expenses. BACKEND ROYALTY: If gross earnings exceed INR 2,000, Licensee shall remit a 20% Net Master Royalty to Licensor on excess streaming, download, and sync revenues. Underlying musical composition is split 50% Writer (DZVN) and 50% Lyricist (Licensee) statutory under the Indian Copyright Act.`
        : "For Free and Basic leases, 100% of revenue within the authorized stream cap belongs to the Licensee. Underlying composition publishing royalties remain split 50/50 between Writer (DZVN) and Lyricist under the Indian Copyright Act, 1957. Exceeding stream limits requires upgrading to an Exclusive Contract.",
    },
    {
      title: "5. CONTENT ID & ACOUSTIC FINGERPRINTING BAN",
      text: isExclusive
        ? "Exclusive Licensee is authorized to register the unique derivative sound recording with YouTube Content ID and digital fingerprinting databases."
        : "Licensee is STRICTLY FORBIDDEN from registering the beat or derivative track with automated acoustic fingerprinting services (YouTube Content ID, Meta Rights Manager, Shazam). Violation triggers immediate termination of rights and statutory DMCA / Section 51 copyright take-down notices.",
    },
    {
      title: "6. ARTIST INDEMNIFICATION & THIRD-PARTY DEFENSE (SEC 124-125)",
      text: "Licensee unconditionally warrants that all lyrics, vocal recordings, sample interpolations, artwork, and marketing materials added to the Beat are 100% original to the Licensee or legally cleared. If Licensee steals lyrics, copies third-party melodies, or infringes copyright, Licensee shall INDEMNIFY, DEFEND, AND HOLD COMPLETELY HARMLESS Denzven Vadakkan and DZVNbeats against any and all claims, lawsuits, damages, advocate fees, and court costs. Zero liability transfers to Licensor.",
    },
    {
      title: "7. DEFAMATION, OBSCENITY & CRIMINAL LYRICAL SHIELD",
      text: "Licensor exercises zero editorial supervision or censorship over Licensee's lyrics. Licensee assumes 100% sole civil and criminal liability for all vocal content under the Bharatiya Nyaya Sanhita, 2023 (BNS), Information Technology Act, 2000 (Sections 67, 69A), and related Indian statutes. Licensor disclaims all liability for hate speech, communal disharmony, defamation, or obscenity.",
    },
    {
      title: "8. ABSOLUTE MONETARY LIABILITY CAP (SEC 73-74)",
      text: `TO THE MAXIMUM EXTENT PERMITTED UNDER INDIAN LAW, LICENSOR'S TOTAL AGGREGATE LIABILITY FOR ANY AND ALL CLAIMS OR BREACHES ARISING OUT OF THIS AGREEMENT SHALL BE STRICTLY LIMITED AND CAPPED AT THE EXACT SUM PAID FOR THIS LICENSE (${priceText}). Licensor disclaims all liability for indirect or speculative damages (including claims that the beat 'ruined a career' or lost a record deal). The beat is provided strictly 'AS-IS'.`,
    },
    {
      title: "9. GOVERNING LAW & EXCLUSIVE MUMBAI JURISDICTION",
      text: "This Agreement shall be interpreted and governed in accordance with the substantive laws of the Republic of India. The parties irrevocably submit to the exclusive jurisdiction of the competent civil courts located in Mumbai, Maharashtra, India. Any arbitration shall be conducted in English in Mumbai under the Arbitration and Conciliation Act, 1996.",
    },
  ];

  clauses.forEach((c) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(20, 20, 30);
    doc.text(c.title, margin, p2y);
    p2y += 3.2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(65, 70, 80);
    const lines = doc.splitTextToSize(c.text, contentWidth);
    doc.text(lines, margin, p2y);
    p2y += lines.length * 2.8 + 2.8;
  });

  // Closing Legal Seal Box on Page 2 (Properly wrapped, zero cutoff!)
  p2y = Math.max(p2y + 2, 252);
  doc.setFillColor(248, 249, 252);
  doc.setDrawColor(215, 220, 230);
  doc.roundedRect(margin, p2y, contentWidth, 18, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(40, 45, 60);
  doc.text("LEGAL ATTESTATION & ENFORCEABILITY", margin + 6, p2y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.4);
  doc.setTextColor(85, 90, 105);
  const attestationText =
    "This studio agreement represents the complete understanding between the parties. Retain this 2-page document as your permanent proof of commercial licensing for all DSP distributors, PROs, and streaming services.";
  const aLines = doc.splitTextToSize(attestationText, contentWidth - 12);
  doc.text(aLines, margin + 6, p2y + 10.5);

  // Page 2 Safe Footer Bar (Positioned at 282mm, extends to 297mm with gold accent line)
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

  const cleanFileName = `DZVNbeats_${tierName.replace(/[^a-zA-Z0-9]/g, "_")}_${
    beatTitle ? beatTitle.replace(/[^a-zA-Z0-9]/g, "_") : "License"
  }.pdf`;

  doc.save(cleanFileName);
}
