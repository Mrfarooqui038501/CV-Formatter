// server/services/aiService.js
import axios from 'axios';

const CV_EXTRACTION_PROMPT = `
Extract and structure the CV data into the following JSON format. Be very precise with formatting and ensure all sections are properly filled:

{
  "fullName": "Full name from CV",
  "jobTitle": "Primary job title/profession",
  "personalDetails": {
    "nationality": "Nationality",
    "languages": ["Language1", "Language2"],
    "dob": "Date of birth (DD/MM/YYYY format)",
    "maritalStatus": "Single/Married/etc",
    "email": "email@domain.com",
    "phone": "+XX XXX XXX XXXX",
    "location": "City, Country"
  },
  "profile": "Professional summary/profile paragraph",
  "experience": [
    {
      "role": "Job Title",
      "company": "Company Name",
      "location": "City, Country",
      "startDate": "YYYY-MM or YYYY",
      "endDate": "YYYY-MM or YYYY or Present",
      "bullets": [
        "• Achievement or responsibility 1",
        "• Achievement or responsibility 2"
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
- Job titles should be properly capitalized
- Experience should be in reverse chronological order (most recent first)
- Bullet points should start with action verbs
- Dates should be in consistent format (YYYY-MM or just YYYY)
- Remove any placeholder text like [empty] or similar
- Ensure all text is professionally written and grammatically correct
- Profile section should be a compelling paragraph, not bullet points

Return ONLY the JSON object, no additional text.`;

const REGISTRATION_EXTRACTION_PROMPT = `
Extract personal/registration information from this CV into the following JSON format:

{
  "fullName": "Full name",
  "email": "email@domain.com",
  "phone": "+XX XXX XXX XXXX",
  "languages": ["Language1", "Language2"],
  "nationality": "Nationality",
  "dob": "DD/MM/YYYY",
  "maritalStatus": "Single/Married/etc",
  "location": "City, Country"
}

Return ONLY the JSON object, no additional text.`;

const HTML_PREVIEW_PROMPT = `
Convert the following structured CV JSON into clean HTML preview using Palatino Linotype font family. 
Make it match professional CV formatting with proper spacing and hierarchy:

Use this structure:
- Center-aligned header with name (large, bold) and job title (italic)
- Left-aligned sections with clear headings
- Professional spacing and typography
- Bullet points for experience and skills
- Clean, readable layout

Return ONLY the HTML content (no <!DOCTYPE> or <html> tags), just the body content.`;

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