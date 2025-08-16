import { Document, Paragraph, TextRun, Packer, HeadingLevel, AlignmentType, ImageRun } from 'docx';

const CM_TO_EMU = 360000; // 1 cm in EMUs
const PHOTO_CM = 4.7;
const PHOTO_EMU = Math.round(PHOTO_CM * CM_TO_EMU);

const palatino = 'Palatino Linotype';

const monthMap = {
  '01':'Jan','1':'Jan','02':'Feb','2':'Feb','03':'Mar','3':'Mar','04':'Apr','4':'Apr',
  '05':'May','5':'May','06':'Jun','6':'Jun','07':'Jul','7':'Jul','08':'Aug','8':'Aug',
  '09':'Sep','9':'Sep','10':'Oct','11':'Nov','12':'Dec'
};

const capJob = (s) => {
  if (!s) return '';
  return s.split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ');
};

const tidy = (s='') => s
  .replace(/\b[Ii]\s*am\s*responsible\s*for\b/g, 'Responsible for')
  .replace(/\b[Pp]rinciple\b/g, 'Principal')
  .replace(/\b[Dd]iscrete\b/g, 'Discreet')
  .trim();

const fmtDate = (d) => {
  if (!d) return null;
  if (d === 'Present') return 'Present';
  // supports YYYY or YYYY-MM
  if (/^\d{4}$/.test(d)) return d;
  const m = d.match(/^(\d{4})-(\d{1,2})$/);
  if (m) return `${monthMap[m[2]]} ${m[1]}`;
  return d;
};

const bulletPara = (text) =>
  new Paragraph({
    children: [new TextRun({ text: tidy(text), font: palatino, size: 22 })],
    bullet: { level: 0 }
  });

const labelLine = (label, value) =>
  new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, font: palatino, size: 22 }),
      new TextRun({ text: value ?? '', font: palatino, size: 22 })
    ],
    spacing: { after: 80 }
  });

export const renderFinalCvDocx = async ({ cv, headshotBuffer }) => {
  // Normalize
  cv.jobTitle = capJob(cv.jobTitle);
  if (Array.isArray(cv.experience)) {
    cv.experience = cv.experience.map(e => ({
      ...e,
      role: capJob(e.role),
      bullets: (e.bullets || []).map(tidy),
      startDate: fmtDate(e.startDate),
      endDate: fmtDate(e.endDate)
    }));
  }

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: palatino } }
      }
    },
    sections: [{
      properties: {
        page: { margin: { top: 720, bottom: 720, left: 860, right: 860 } } // ~1.27cm
      },
      children: [
        // Header: Name and Job Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: cv.fullName || '', bold: true, size: 36, font: palatino })
          ],
          spacing: { after: 80 }
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: cv.jobTitle || '', italics: true, size: 24, font: palatino })
          ],
          spacing: { after: 200 }
        }),

        // Photo
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: headshotBuffer
            ? [ new ImageRun({ data: headshotBuffer, transformation: { width: PHOTO_EMU, height: PHOTO_EMU } }) ]
            : [
                new TextRun({
                  text: '[ Headshot Placeholder 4.7 cm ]',
                  size: 20, font: palatino
                })
              ],
          spacing: { after: 300 }
        }),

        // Personal Details
        new Paragraph({ text: 'Personal Details', heading: HeadingLevel.HEADING_2 }),
        labelLine('Nationality', cv.personalDetails?.nationality || ''),
        labelLine('Languages', (cv.personalDetails?.languages || []).join(', ')),
        labelLine('Marital Status', cv.personalDetails?.maritalStatus || ''),
        labelLine('Email', cv.personalDetails?.email || ''),
        labelLine('Phone', cv.personalDetails?.phone || ''),
        labelLine('Location', cv.personalDetails?.location || ''),

        // Profile
        new Paragraph({ text: 'Profile', heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ children: [ new TextRun({ text: tidy(cv.profile || ''), font: palatino, size: 22 }) ], spacing: { after: 200 } }),

        // Experience (reverse chronological if possible)
        new Paragraph({ text: 'Experience', heading: HeadingLevel.HEADING_2 }),
        ...((cv.experience || []).slice().reverse().map((e) => ([
          new Paragraph({
            children: [
              new TextRun({ text: `${e.role || ''} — ${e.company || ''}`, bold: true, font: palatino, size: 24 })
            ],
            spacing: { after: 40 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: [e.location, [e.startDate, e.endDate].filter(Boolean).join(' - ')].filter(Boolean).join(' • '),
                italics: true, font: palatino, size: 20
              })
            ],
            spacing: { after: 80 }
          }),
          ...(e.bullets || []).map(bulletPara),
          new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 160 } })
        ])).flat()),

        // Education
        new Paragraph({ text: 'Education', heading: HeadingLevel.HEADING_2 }),
        ...((cv.education || []).map(ed =>
          new Paragraph({
            children: [
              new TextRun({ text: `${ed.institution || ''} — ${ed.program || ''}`, font: palatino, size: 22 }),
              new TextRun({
                text: ed.startYear || ed.endYear ? ` (${[ed.startYear, ed.endYear].filter(Boolean).join(' - ')})` : '',
                font: palatino, size: 22
              })
            ],
            spacing: { after: 80 }
          })
        )),

        // Skills
        new Paragraph({ text: 'Key Skills', heading: HeadingLevel.HEADING_2 }),
        ...((cv.skills || []).map(s => bulletPara(s))),
        new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 160 } }),

        // Interests
        new Paragraph({ text: 'Interests', heading: HeadingLevel.HEADING_2 }),
        ...((cv.interests || []).map(i => bulletPara(i)))
      ]
    }]
  });

  return Packer.toBuffer(doc);
};


export const renderRegistrationDocx = async (reg) => {
  const doc = new Document({
    styles: { default: { document: { run: { font: palatino } } } },
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 860, right: 860 } } },
      children: [
        new Paragraph({ text: 'Registration Form', heading: HeadingLevel.TITLE, spacing: { after: 300 } }),
        labelLine('Full Name', reg.fullName || ''),
        labelLine('Email', reg.email || ''),
        labelLine('Phone', reg.phone || ''),
        labelLine('Languages', (reg.languages || []).join(', ')),
        labelLine('Nationality', reg.nationality || ''),
        labelLine('Date of Birth', reg.dob || ''),
        labelLine('Gender', reg.gender || ''),
        labelLine('Preferred Gender Pronouns', reg.preferredPronouns || ''),
        labelLine('Marital Status', reg.maritalStatus || ''),
        labelLine('Dependants', reg.dependants || ''),
        labelLine('Are you legal and have the correct documents to work in the UK?', reg.workInUk || ''),
        labelLine('National Insurance Number', reg.nationalInsuranceNumber || ''),
        labelLine('UTR Number if Self-Employed', reg.utrNumber || ''),
        labelLine('Do you have a current DBS?', reg.currentDBS || ''),
        labelLine('Do you have a criminal record?', reg.criminalRecord || ''),
        labelLine('Do you smoke/vape?', reg.smokesVapes || ''),
        labelLine('Happy to work in a residence with pets?', reg.workWithPets || ''),
        labelLine('Do you have a driving licence?', reg.drivingLicence || ''),
        labelLine('Is your licence clean?', reg.licenceClean || ''),
        labelLine('Positions applying for', reg.positionsApplyingFor || ''),
        labelLine('Yearly desired salary', reg.yearlyDesiredSalary || ''),
        labelLine('Current notice period', reg.currentNoticePeriod || ''),
        labelLine('Preferred work location', reg.preferredWorkLocation || ''),
        labelLine('Live in or out positions preferred?', reg.liveInOrOut || ''),
        new Paragraph({ children: [ new TextRun({ text: 'Emergency Contact Details', bold: true, font: palatino, size: 22 }) ], spacing: { after: 80 } }),
        labelLine('Name', reg.emergencyContactDetails?.name || ''),
        labelLine('Telephone', reg.emergencyContactDetails?.phone || ''),
        labelLine('Relationship to Candidate', reg.emergencyContactDetails?.relationship || ''),
      ]
    }]
  });
  return Packer.toBuffer(doc);
};
