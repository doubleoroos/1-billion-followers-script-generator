
import { jsPDF } from "jspdf";
import type { GeneratedAssets, RewriteTomorrowTheme, EmotionalArcIntensity, VisualStyle, NarrativeTone } from '../types';

export const downloadPDF = (
  assets: GeneratedAssets,
  choices: { theme: RewriteTomorrowTheme, arc: EmotionalArcIntensity, style: VisualStyle, tone: NarrativeTone },
  isPremium: boolean = false
) => {
  const doc = new jsPDF();
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = width - (margin * 2);
  let y = margin;

  const checkSpace = (requiredHeight: number) => {
    if (y + requiredHeight > height - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  const addWatermark = () => {
    if (!isPremium) {
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(50);
            doc.setTextColor(200, 200, 200);
            doc.setFont("helvetica", "bold");
            // Rotate 45 degrees
            doc.text("FREE TIER - REWRITE TOMORROW", width/2, height/2, { align: "center", angle: 45, renderingMode: "stroke" });
            
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text("Support Earth Rising to remove watermark: earthrising.space", width/2, height - 10, { align: "center", angle: 0 });
            doc.setTextColor(0); // Reset
        }
    }
  };

  const addHeading = (text: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    checkSpace(20);
    doc.text(text, margin, y);
    y += 10;
    doc.setLineWidth(0.5);
    doc.line(margin, y - 2, width - margin, y - 2);
    y += 5;
  };

  const addSection = (label: string, text: string, font: string = "helvetica") => {
      if (!text) return; // Skip empty sections
      checkSpace(15);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(label, margin, y);
      y += 5;
      
      doc.setFont(font, "normal");
      doc.setFontSize(10);
      const cleanText = String(text).replace(/[^\x00-\x7F]/g, ""); 
      const lines = doc.splitTextToSize(cleanText, contentWidth);
      const lineHeight = 5; 
      checkSpace(lines.length * lineHeight);
      doc.text(lines, margin, y);
      y += (lines.length * lineHeight) + 4;
  };

  // Title Page
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
  
  y = (height / 2) + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Creative Direction", width/2, y, { align: 'center' });
  y += 10;
  
  const choicesText = [
    `Theme: ${choices.theme}`,
    `Tone: ${choices.tone}`,
    `Visual Style: ${choices.style}`,
    `Emotional Arc: ${choices.arc}`
  ];
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  choicesText.forEach(line => {
      doc.text(line, width/2, y, { align: 'center' });
      y += 7;
  });

  doc.addPage();
  y = margin;

  // Characters
  addHeading("Characters");
  assets.characters.forEach(char => {
      checkSpace(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`${char.name} (${char.role})`, margin, y);
      y += 6;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(char.description || '', contentWidth);
      checkSpace(lines.length * 6);
      doc.text(lines, margin, y);
      y += (lines.length * 6) + 8;
  });

  doc.addPage();
  y = margin;

  // Script
  addHeading("Script");
  doc.setFont("courier", "normal");
  const scriptLineHeight = 5;
  
  assets.script.forEach(block => {
      if (block.type === 'narration') {
          checkSpace(20);
          doc.setFont("courier", "italic"); 
          doc.setFontSize(11);
          const lines = doc.splitTextToSize("(NARRATION) " + (block.content || ''), contentWidth);
          checkSpace(lines.length * scriptLineHeight);
          doc.text(lines, margin, y);
          y += (lines.length * scriptLineHeight) + 6;
      } else {
          checkSpace(25);
          const charName = assets.characters.find(c => c.id === block.characterId)?.name.toUpperCase() || 'UNKNOWN';
          doc.setFont("courier", "bold");
          doc.setFontSize(11);
          doc.text(charName, margin + 25, y); 
          y += 6;
          
          doc.setFont("courier", "normal");
          const lines = doc.splitTextToSize(block.content || '', contentWidth - 40); 
          checkSpace(lines.length * scriptLineHeight);
          doc.text(lines, margin + 15, y); 
          y += (lines.length * scriptLineHeight) + 6;
      }
  });

  doc.addPage();
  y = margin;

  // Visual Outline
  addHeading("Visual Outline & Prompts");
  assets.visualOutline.forEach((scene) => {
      checkSpace(60); 
      
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, contentWidth, 8, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Scene ${scene.sceneNumber}: ${scene.title || 'Untitled'}`, margin + 2, y + 6);
      y += 14;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text(`${scene.location || 'Unknown'} | ${scene.timeOfDay || 'Day'}`, margin, y);
      doc.setTextColor(0);
      y += 8;
      
      addSection("Action Description", scene.description || '');
      addSection("Visuals", scene.visuals || '');
      
      if (scene.videoPrompt) {
          checkSpace(25);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 50, 150);
          doc.text("Video Prompt (Veo):", margin, y);
          doc.setTextColor(0);
          y += 5;
          
          doc.setFont("courier", "normal");
          doc.setFontSize(9);
          const lines = doc.splitTextToSize(scene.videoPrompt || '', contentWidth);
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
          const lines = doc.splitTextToSize(scene.imagePrompt || '', contentWidth);
          checkSpace(lines.length * 4);
          doc.text(lines, margin, y);
          y += (lines.length * 4) + 6;
      }
      
      y += 8; 
      doc.setLineWidth(0.1);
      doc.setDrawColor(200);
      doc.line(margin, y, width - margin, y);
      y += 8;
  });

  doc.addPage();
  y = margin;

  addHeading("Behind The Scenes");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const btsLines = doc.splitTextToSize(assets.btsDocument || '', contentWidth);
  const btsLineHeight = 6;
  
  let currentBtsY = y;
  for (let i = 0; i < btsLines.length; i++) {
      if (currentBtsY + btsLineHeight > height - margin) {
          doc.addPage();
          currentBtsY = margin;
      }
      doc.text(btsLines[i], margin, currentBtsY);
      currentBtsY += btsLineHeight;
  }
  
  // Apply watermark to all pages if not premium
  addWatermark();

  doc.save(`Rewrite_Tomorrow_${choices.theme}_${Date.now()}.pdf`);
};