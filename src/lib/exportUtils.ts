import { PatentDisclosure, DiagnosisReport } from "../types/patent";

export async function exportToDocx(disclosure: PatentDisclosure, diagnosis: DiagnosisReport) {
  // Dynamic imports for docx
  const docx = await import("docx");
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } = docx;

  const title = disclosure.title || '未命名';
  
  // Create Header Table
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " 发明名称", bold: true })] })], width: { size: 20, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph(disclosure.title || "")], width: { size: 30, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " 项目编号", bold: true })] })], width: { size: 20, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph("")] }),
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " 发明人", bold: true })] })] }),
          new TableCell({ children: [new Paragraph("")] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " 部门/联系方式", bold: true })] })] }),
          new TableCell({ children: [new Paragraph("")] }),
        ]
      })
    ]
  });

  // Create Problem/Solution/Effect Table
  const pointsRows = diagnosis.patentPoints.map((point, index) => {
    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(`技术问题 ${index + 1} (现有缺陷)`)] }),
        new TableCell({ children: [new Paragraph(point.feature)] }),
        new TableCell({ children: [new Paragraph(point.effect)] }),
      ]
    });
  });

  const analysisTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "要解决的技术问题", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 30, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "采取的本发明技术方案", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 40, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "达到的有益效果", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 30, type: WidthType.PERCENTAGE } }),
        ]
      }),
      ...pointsRows
    ]
  });

  function parseInlineMarkdown(text: string): TextRun[] {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map(part => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return new TextRun({ text: part.slice(2, -2), bold: true });
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return new TextRun({ text: part.slice(1, -1), italics: true });
      }
      return new TextRun({ text: part });
    });
  }

  function parseMarkdownToDocx(markdown: string) {
    const elements: (any | any)[] = []; // docx.Paragraph | docx.Table
    const lines = markdown.split('\n');
    
    let tableRows: string[][] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Table handling
      if (line.startsWith('|') && line.endsWith('|')) {
        const cols = line.split('|').filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1).map(c => c.trim());
        if (cols.every(c => c.replace(/-/g, '').trim() === '')) {
          continue; // Skip separator line
        }
        tableRows.push(cols);
        continue;
      } else if (tableRows.length > 0) {
        // Build table
        const rows = tableRows.map((row, rowIdx) => {
          return new TableRow({
            children: row.map(col => {
              return new TableCell({
                children: [new Paragraph({ children: parseInlineMarkdown(col) })]
              });
            })
          });
        });
        
        elements.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: rows
        }));
        tableRows = [];
      }
      
      if (!line) {
        elements.push(new Paragraph({ text: "", spacing: { after: 120 } }));
        continue;
      }

      if (line.startsWith('# ')) {
        elements.push(new Paragraph({ text: line.replace('# ', ''), heading: HeadingLevel.HEADING_1 }));
      } else if (line.startsWith('## ')) {
        elements.push(new Paragraph({ text: line.replace('## ', ''), heading: HeadingLevel.HEADING_2 }));
      } else if (line.startsWith('### ')) {
        elements.push(new Paragraph({ text: line.replace('### ', ''), heading: HeadingLevel.HEADING_3 }));
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(new Paragraph({
          children: parseInlineMarkdown(line.slice(2)),
          bullet: { level: 0 }
        }));
      } else if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^\d+\.\s(.*)/);
        if (match) {
           elements.push(new Paragraph({
             children: parseInlineMarkdown(match[1]),
             numbering: { reference: "my-numbered-list", level: 0 },
             spacing: { after: 120 }
           }));
        }
      } else {
        elements.push(new Paragraph({ children: parseInlineMarkdown(line), spacing: { after: 120 } }));
      }
    }
    
    // Process trailing table if any
    if (tableRows.length > 0) {
        const rows = tableRows.map((row, rowIdx) => {
          return new TableRow({
            children: row.map(col => {
              return new TableCell({
                children: [new Paragraph({ children: parseInlineMarkdown(col) })]
              });
            })
          });
        });
        
        elements.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: rows
        }));
    }

    return elements;
  }

  const fullContent = [
    `# 一、发明名称\n${disclosure.title}`,
    `# 二、技术领域\n${disclosure.field}`,
    `# 三、背景技术及现有缺陷\n${disclosure.background}`,
    `# 四、发明目的\n${disclosure.purpose}`,
    `# 五、技术方案（核心保护点）\n${disclosure.solution}`,
    `# 六、有益效果\n${disclosure.effects}`,
    `# 七、附图说明\n${disclosure.figures}`,
    `# 八、具体实施方式\n${disclosure.implementation}`
  ].join('\n\n');

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "my-numbered-list",
          levels: [
            {
              level: 0,
              format: "decimal",
              text: "%1.",
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "企业标准技术交底书", heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
        new Paragraph({ text: "" }),
        headerTable,
        new Paragraph({ text: "" }),
        new Paragraph({ text: "【技术方案梳理与对照】", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: "" }),
        analysisTable,
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        ...parseMarkdownToDocx(fullContent)
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `专利交底书_${title}.docx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function exportToPdf(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    // Dynamic imports for PDF export
    const [jsPDFMod, html2canvasMod] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ]);
    const jsPDF = jsPDFMod.default;
    const html2canvas = html2canvasMod.default;

    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    const imgScaledWidth = imgWidth * ratio;
    const imgScaledHeight = imgHeight * ratio;
    
    // Center alignment
    const marginX = (pdfWidth - imgScaledWidth) / 2;
    const marginY = 10; // Top margin

    // Check if multiple pages are needed
    let heightLeft = imgHeight;
    let position = 0;
    const pageHeight = pdfHeight;
    const imgWidthInPDF = pdfWidth;
    const imgHeightInPDF = (imgHeight * pdfWidth) / imgWidth;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidthInPDF, imgHeightInPDF);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeightInPDF;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidthInPDF, imgHeightInPDF);
      heightLeft -= pageHeight;
    }

    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error("PDF Export failed:", error);
    throw error;
  }
}
