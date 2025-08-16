// server/services/fileParser.js
import mammoth from 'mammoth';
import * as ExcelJS from 'exceljs';
import { createRequire } from 'module';
import { Document, Paragraph, TextRun, Packer } from 'docx';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// PDF Parsing
export const parsePDF = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF');
  }
};

// DOCX Parsing (with fallback + placeholder marking)
export const parseDOCX = async (buffer) => {
  try {
    // First try with Mammoth
    const result = await mammoth.extractRawText({ buffer });
    let text = result.value?.trim();

    // If no text extracted, fallback to raw XML
    if (!text) {
      const zip = await import('jszip').then(m => new m.default());
      const doc = await zip.loadAsync(buffer);
      const xml = await doc.file("word/document.xml").async("string");

      // Extract visible text
      text = xml
        .replace(/<w:p[^>]*>/g, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    if (!text) return 'No readable content found in the DOCX file.';

    // 🔑 Mark placeholders with [empty] if no value is present
    const processed = text
      .split("\n")
      .map(line => {
        if (/:$/.test(line.trim())) {
          return `${line.trim()} [empty]`;
        }
        if (/:\s*$/.test(line.trim())) {
          return `${line.trim()} [empty]`;
        }
        return line.trim();
      })
      .join("\n");

    return processed;
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error('Failed to parse DOCX');
  }
};

// Excel Parsing
export const parseExcel = async (buffer) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    let content = '';
    workbook.eachSheet((ws) => {
      ws.eachRow((row) => {
        row.eachCell((cell) => { content += `${cell.value ?? ''}\t`; });
        content += '\n';
      });
    });
    return content;
  } catch (error) {
    console.error('Excel parsing error:', error);
    throw new Error('Failed to parse Excel file');
  }
};

// DOCX Generation
export const generateDOCX = async (content) => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: content,
                font: 'Palatino Linotype'
              })
            ]
          })
        ]
      }
    ]
  });

  return Packer.toBuffer(doc);
};
