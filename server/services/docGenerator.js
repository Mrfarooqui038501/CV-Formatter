import { Document, Paragraph, TextRun, Packer } from 'docx';

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