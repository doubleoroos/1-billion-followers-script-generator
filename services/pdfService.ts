
import { jsPDF } from "jspdf";
import type { GeneratedAssets, RewriteTomorrowTheme, EmotionalArcIntensity, VisualStyle, NarrativeTone } from '../types';

export const downloadPDF = (
  assets: GeneratedAssets,
  choices: { theme: RewriteTomorrowTheme, arc: EmotionalArcIntensity, style: VisualStyle, tone: NarrativeTone }
) => {
  const doc = new jsPDF();
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = width - (margin * 2);
  let y = margin;

  // Helper for checking page breaks
  const checkSpace = (requiredHeight: number) => {
    if (y + requiredHeight > height - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Helper for adding section headings
  const addHeading = (text: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    checkSpace(20);
    doc.text(text, margin, y);
    y += 10;
    // Underline
    doc.setLineWidth(0.5);
    doc.line(margin, y - 2, width - margin, y - 2);
    y += 5;
  };

  // Helper for adding labeled sections
  const addSection = (label: string, text: string, font: string = "helvetica") => {
      checkSpace(15);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(label, margin, y);
      y += 5;
      
      doc.setFont(font, "normal");
      doc.setFontSize(10);
      // Clean text
      const cleanText = text.replace(/[^\x00-\x7F]/g, ""); // Basic cleanup if needed, but standard fonts support latin 1
      const lines = doc.splitTextToSize(cleanText || text, contentWidth);
      const lineHeight = 5; // Approx 5mm per line at 10pt
      checkSpace(lines.length * lineHeight);
      doc.text(lines, margin, y);
      y += (lines.length * lineHeight) + 4;
  };

  // --- CONTENT GENERATION ---

  // 1. Title Page
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("Rewrite Tomorrow", width / 2, height / 3, { align: "center" });
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.text("Film Submission Package", width / 2, (height / 3) + 12, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, width / 2, height - 20, { align: "center" });
  doc.setTextColor(0);
  
  // Creative Choices Summary
  y = (height / 2) + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Creative Direction", width/2, y, { align: 'center' });
  y += 10;
  
  const choicesText = [
    `Theme: ${choices.theme.charAt(0).toUpperCase() + choices.theme.slice(1)}`,
    `Tone: ${choices.tone.charAt(0).toUpperCase() + choices.tone.slice(1)}`,
    `Visual Style: ${choices.style.charAt(0).toUpperCase() + choices.style.slice(1)}`,
    `Emotional Arc: ${choices.arc.charAt(0).toUpperCase() + choices.arc.slice(1)}`
  ];
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  choicesText.forEach(line => {
      doc.text(line, width/2, y, { align: 'center' });
      y += 7;
  });

  doc.addPage();
  y = margin;

  // 2. Characters
  addHeading("Characters");
  assets.characters.forEach(char => {
      checkSpace(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`${char.name} (${char.role})`, margin, y);
      y += 6;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(char.description, contentWidth);
      checkSpace(lines.length * 6);
      doc.text(lines, margin, y);
      y += (lines.length * 6) + 8;
  });

  doc.addPage();
  y = margin;

  // 3. Script
  addHeading("Script");
  doc.setFont("courier", "normal");
  const scriptLineHeight = 5;
  
  assets.script.forEach(block => {
      if (block.type === 'narration') {
          checkSpace(20);
          doc.setFont("courier", "italic"); // Italic often not avail in default courier, falls back to normal
          doc.setFontSize(11);
          const lines = doc.splitTextToSize("(NARRATION) " + block.content, contentWidth);
          checkSpace(lines.length * scriptLineHeight);
          doc.text(lines, margin, y);
          y += (lines.length * scriptLineHeight) + 6;
      } else {
          checkSpace(25);
          const charName = assets.characters.find(c => c.id === block.characterId)?.name.toUpperCase() || 'UNKNOWN';
          doc.setFont("courier", "bold");
          doc.setFontSize(11);
          doc.text(charName, margin + 25, y); // Indent character name
          y += 6;
          
          doc.setFont("courier", "normal");
          const lines = doc.splitTextToSize(block.content, contentWidth - 40); // Narrower for dialogue
          checkSpace(lines.length * scriptLineHeight);
          doc.text(lines, margin + 15, y); // Indent dialogue block
          y += (lines.length * scriptLineHeight) + 6;
      }
  });

  doc.addPage();
  y = margin;

  // 4. Visual Outline & Prompts
  addHeading("Visual Outline & Prompts");
  assets.visualOutline.forEach((scene, index) => {
      checkSpace(60); // Ensure header stays with some content
      
      // Scene Header Background
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, contentWidth, 8, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Scene ${scene.sceneNumber}: ${scene.title}`, margin + 2, y + 6);
      y += 14;

      // Metadata
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text(`${scene.location} | ${scene.timeOfDay} | ${scene.duration} | ${scene.atmosphere}`, margin, y);
      doc.setTextColor(0);
      y += 8;
      
      addSection("Action Description", scene.description);
      addSection("Visuals", scene.visuals);
      
      if (scene.videoPrompt) {
          checkSpace(25);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 50, 150);
          doc.text("Video Prompt (Veo):", margin, y);
          doc.setTextColor(0);
          y += 5;
          
          doc.setFont("courier", "normal");
          doc.setFontSize(9);
          const lines = doc.splitTextToSize(scene.videoPrompt, contentWidth);
          checkSpace(lines.length * 4);
          doc.text(lines, margin, y);
          y += (lines.length * 4) + 6;
      }
      
      if (scene.imagePrompt) {
          checkSpace(25);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(100, 0, 100);
          doc.text("Image Prompt (Imagen):", margin, y);
          doc.setTextColor(0);
          y += 5;
          
          doc.setFont("courier", "normal");
          doc.setFontSize(9);
          const lines = doc.splitTextToSize(scene.imagePrompt, contentWidth);
          checkSpace(lines.length * 4);
          doc.text(lines, margin, y);
          y += (lines.length * 4) + 6;
      }
      
      y += 8; // Divider space
      doc.setLineWidth(0.1);
      doc.setDrawColor(200);
      doc.line(margin, y, width - margin, y);
      y += 8;
  });

  doc.addPage();
  y = margin;

  // 5. BTS
  addHeading("Behind The Scenes");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const btsLines = doc.splitTextToSize(assets.btsDocument, contentWidth);
  const btsLineHeight = 6;
  
  // BTS might be long, check per line block or just iterate?
  // splitTextToSize returns array. We can just check space for chunk.
  // Or rudimentary loop.
  
  let currentBtsY = y;
  for (let i = 0; i < btsLines.length; i++) {
      if (currentBtsY + btsLineHeight > height - margin) {
          doc.addPage();
          currentBtsY = margin;
      }
      doc.text(btsLines[i], margin, currentBtsY);
      currentBtsY += btsLineHeight;
  }

  doc.save(`Rewrite_Tomorrow_${choices.theme}_${Date.now()}.pdf`);
};
