import axios from 'axios';

const formattingPrompt = `
Please reformat this CV according to the following professional standards:

Typography & Structure:
- Font: Palatino Linotype (note this in the formatting)
- Photo Sizing: 4.7cm (handle landscape → portrait conversion if needed)
- Date Format: First 3 letters only (e.g., Jan 2020, not January 2020)
- Capitalization: Job titles always start with capital letters

Content Organization:
1. Header: Name, Job Title, Professional Photo
2. Personal Details: Nationality, Languages, DOB, Marital Status
3. Profile: Professional summary
4. Experience: Reverse chronological, bullet-pointed
5. Education: Consistent formatting
6. Key Skills: Bullet-pointed
7. Interests: Bullet-pointed

Content Cleanup Rules:
- Remove redundant phrases (e.g., "I am responsible for" → "Responsible for")
- Fix common mistakes (e.g., "Principle" → "Principal", "Discrete" → "Discreet")
- Remove inappropriate fields: Age, Dependants
- Convert paragraphs to bullet points where appropriate
- Ensure professional tone throughout

Return only the formatted CV content, no additional explanations.
`;

export const formatWithGPT4 = async (content) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional CV formatter. Follow the instructions carefully.'
          },
          {
            role: 'user',
            content: `${formattingPrompt}\n\nCV Content:\n${content}`
          }
        ],
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('GPT-4 formatting error:', error);
    throw new Error('Failed to format with GPT-4');
  }
};

export const formatWithClaude = async (content) => {
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `${formattingPrompt}\n\nCV Content:\n${content}`
          }
        ],
        temperature: 0.3
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      }
    );

    return response.data.content[0].text;
  } catch (error) {
    console.error('Claude formatting error:', error);
    throw new Error('Failed to format with Claude');
  }
};

export const formatWithGemini = async (content) => {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `${formattingPrompt}\n\nCV Content:\n${content}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3
        }
      }
    );

    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini formatting error:', error);
    throw new Error('Failed to format with Gemini');
  }
};