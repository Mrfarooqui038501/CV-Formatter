import axios from 'axios';

// Final CV JSON schema (for formattedStructured)
const CV_EXTRACTION_PROMPT = `
Extract and structure the CV data into the following JSON format. Be very precise with formatting and ensure all sections are properly filled. The final CV should look professional and polished, so the tone of the extracted text should be professional and well-written.

{
  "fullName": "Full name from CV",
  "jobTitle": "Primary job title/profession",
  "personalDetails": {
    "nationality": "Nationality",
    "languages": ["Language1", "Language2"],
    "maritalStatus": "Single/Married/etc",
    "email": "email@domain.com",
    "phone": "+XX XXX XXX XXXX",
    "location": "City, Country"
  },
  "profile": "Professional summary/profile paragraph. Rewrite for clarity and professionalism.",
  "experience": [
    {
      "role": "Job Title",
      "company": "Company Name",
      "location": "City, Country",
      "startDate": "YYYY-MM or YYYY",
      "endDate": "YYYY-MM or YYYY or Present",
      "bullets": [
        "• Achievement or responsibility 1. Use an action verb.",
        "• Achievement or responsibility 2. Use an action verb."
      ]
    }
  ],
  "education": [
    {
      "program": "Degree/Program name",
      "institution": "University/Institution name",
      "startYear": "YYYY",
      "endYear": "YYYY"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "interests": ["Interest 1", "Interest 2"]
}

Important formatting rules:
- Job titles should be properly capitalized.
- Experience should be in reverse chronological order (most recent first).
- Bullet points should start with action verbs and be concise.
- Dates should be in a consistent YYYY-MM or just YYYY format.
- Remove any placeholder text.
- Ensure all text is professionally written and grammatically correct.
- Profile section should be a compelling paragraph, not bullet points.
- Do NOT include age, date of birth (DOB), gender, or dependants in this output, as they are not part of the final CV.

Return ONLY the JSON object, no additional text.`;


// Registration Form JSON schema (for registrationStructured)
const REGISTRATION_EXTRACTION_PROMPT = `
Extract all personal and registration information from the provided text into a precise JSON format. Be extremely thorough and match the schema exactly. If a field is not present in the source text, provide an empty string "" or an empty array [] for that field.

{
  "fullName": "Full name",
  "email": "email@domain.com",
  "phone": "+XX XXX XXX XXXX",
  "dob": "DD/MM/YYYY",
  "nationality": "Nationality",
  "gender": "Male/Female/Other",
  "preferredPronouns": "He/Him/etc",
  "languages": ["Language1", "Language2"],
  "passportNumber": "Passport Number",
  "maritalStatus": "Single/Married/etc",
  "dependants": "N/a or number",
  "workInUk": "Yes/No",
  "nationalInsuranceNumber": "National Insurance Number",
  "utrNumber": "UTR Number",
  "currentDBS": "Yes/No",
  "criminalRecord": "Yes/No",
  "smokesVapes": "Yes/No",
  "workWithPets": "Yes/No",
  "drivingLicence": "Yes/No",
  "licenceClean": "Yes/No",
  "positionsApplyingFor": "Job Titles",
  "yearlyDesiredSalary": "Salary",
  "currentNoticePeriod": "Notice Period",
  "preferredWorkLocation": "Location",
  "liveInOrOut": "Live in/out positions preferred?",
  "emergencyContactDetails": {
    "name": "Emergency contact name",
    "phone": "Emergency contact phone number",
    "relationship": "Relationship to candidate"
  }
}

Return ONLY the JSON object, no additional text.`;


const HTML_PREVIEW_PROMPT = `
Convert the following structured CV JSON into clean HTML preview using the 'Palatino Linotype' font family. 
Make it match a professional CV with proper spacing and hierarchy, inspired by the EHS template.

Use this structure:
- A prominent header with the full name (large, bold) and job title (italic) aligned in the center.
- Separate sections for Personal Details, Profile, Experience, Education, Skills, and Interests.
- Use bullet points for experience, skills, and interests.
- Use clear headings for each section.

Return ONLY the HTML content, without <!DOCTYPE>, <html>, <head>, or <body> tags.`;


export const formatWithGPT4 = async (rawContent) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    console.log('Processing with GPT-4...');
    
    // Step 1: Extract structured CV data
    const cvResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: CV_EXTRACTION_PROMPT },
        { role: 'user', content: rawContent }
      ],
      temperature: 0.1,
      max_tokens: 2000
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const cvStructured = JSON.parse(cvResponse.data.choices[0].message.content.trim());

    // Step 2: Extract registration data
    const regResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: REGISTRATION_EXTRACTION_PROMPT },
        { role: 'user', content: rawContent }
      ],
      temperature: 0.1,
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const registrationStructured = JSON.parse(regResponse.data.choices[0].message.content.trim());

    // Step 3: Generate HTML preview
    const htmlResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: HTML_PREVIEW_PROMPT },
        { role: 'user', content: JSON.stringify(cvStructured) }
      ],
      temperature: 0.1,
      max_tokens: 1500
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const previewHtml = htmlResponse.data.choices[0].message.content.trim();

    return {
      cvStructured,
      registrationStructured,
      previewHtml,
      formattedContent: JSON.stringify(cvStructured, null, 2) // Legacy field
    };
  } catch (error) {
    console.error('GPT-4 processing error:', error.response?.data || error.message);
    throw new Error(`GPT-4 processing failed: ${error.response?.data?.error?.message || error.message}`);
  }
};


export const formatWithClaude = async (rawContent) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }

  try {
    console.log('Processing with Claude...');
    
    // Step 1: Extract structured CV data
    const cvResponse = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      messages: [
        { role: 'user', content: `${CV_EXTRACTION_PROMPT}\n\nCV Content:\n${rawContent}` }
      ]
    }, {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });

    const cvStructured = JSON.parse(cvResponse.data.content[0].text.trim());

    // Step 2: Extract registration data
    const regResponse = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 500,
      messages: [
        { role: 'user', content: `${REGISTRATION_EXTRACTION_PROMPT}\n\nCV Content:\n${rawContent}` }
      ]
    }, {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });

    const registrationStructured = JSON.parse(regResponse.data.content[0].text.trim());

    // Step 3: Generate HTML preview
    const htmlResponse = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1500,
      messages: [
        { role: 'user', content: `${HTML_PREVIEW_PROMPT}\n\nCV Data:\n${JSON.stringify(cvStructured)}` }
      ]
    }, {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });

    const previewHtml = htmlResponse.data.content[0].text.trim();

    return {
      cvStructured,
      registrationStructured,
      previewHtml,
      formattedContent: JSON.stringify(cvStructured, null, 2)
    };
  } catch (error) {
    console.error('Claude processing error:', error.response?.data || error.message);
    throw new Error(`Claude processing failed: ${error.response?.data?.error?.message || error.message}`);
  }
};


export const formatWithGemini = async (rawContent) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  try {
    console.log('Processing with Gemini...');
    
    // Step 1: Extract structured CV data
    const cvResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: `${CV_EXTRACTION_PROMPT}\n\nCV Content:\n${rawContent}` }]
        }]
      }
    );

    const cvStructured = JSON.parse(cvResponse.data.candidates[0].content.parts[0].text.trim());

    // Step 2: Extract registration data
    const regResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: `${REGISTRATION_EXTRACTION_PROMPT}\n\nCV Content:\n${rawContent}` }]
        }]
      }
    );

    const registrationStructured = JSON.parse(regResponse.data.candidates[0].content.parts[0].text.trim());

    // Step 3: Generate HTML preview
    const htmlResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: `${HTML_PREVIEW_PROMPT}\n\nCV Data:\n${JSON.stringify(cvStructured)}` }]
        }]
      }
    );

    const previewHtml = htmlResponse.data.candidates[0].content.parts[0].text.trim();

    return {
      cvStructured,
      registrationStructured,
      previewHtml,
      formattedContent: JSON.stringify(cvStructured, null, 2)
    };
  } catch (error) {
    console.error('Gemini processing error:', error.response?.data || error.message);
    throw new Error(`Gemini processing failed: ${error.response?.data?.error?.message || error.message}`);
  }
};
