require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');

const app = express();

app.use(cors());

const upload = multer({
    dest: 'uploads/'
});

app.get('/', (req, res) => {
    res.send('AI Service Running');
});

app.post('/analyze', upload.single('resume'), async (req, res) => {

    try {

        if (!req.file) {

            return res.status(400).json({
                atsScore: 0,
                skills: [],
                suggestions: ['Upload Resume']
            });

        }

        const pdfBuffer = fs.readFileSync(req.file.path);

        const pdfData = await pdfParse(pdfBuffer);

        const resumeText = pdfData.text;

        console.log(resumeText);

        // If PDF is empty or image-based

        if (!resumeText || resumeText.trim().length < 20) {

            return res.json({

                atsScore: 15,

                skills: ['No readable text found'],

                suggestions: [
                    'Upload proper text resume PDF',
                    'Image PDFs are not supported',
                    'Use machine-readable resume'
                ]

            });

        }

        const prompt = `
You are an ATS Resume Analyzer.

Analyze the resume carefully.

Extract:
1. ATS score out of 100
2. Technical skills
3. Suggestions for improvement

IMPORTANT:
Return ONLY pure JSON.
Do NOT write explanation.
Do NOT use markdown.

Resume:
${resumeText}

Return EXACTLY this format:

{
  "atsScore": 85,
  "skills": [
    "React",
    "Node.js",
    "MongoDB"
  ],
  "suggestions": [
    "Add more projects",
    "Improve resume summary"
  ]
}
`;

        const response = await fetch(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                method: 'POST',

                headers: {

                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,

                    'Content-Type': 'application/json'

                },

                body: JSON.stringify({

                    model: 'openai/gpt-3.5-turbo',

                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]

                })
            }
        );

        const data = await response.json();

        console.log(JSON.stringify(data, null, 2));

        const text =
            data?.choices?.[0]?.message?.content;

        if (!text) {

            return res.json({

                atsScore: 0,

                skills: ['AI Failed'],

                suggestions: ['No AI response received']

            });

        }

        const cleanedText = text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        let parsedData;

        try {

            parsedData = JSON.parse(cleanedText);

if (!Array.isArray(parsedData.skills)) {
    parsedData.skills = [];
}

if (!Array.isArray(parsedData.suggestions)) {
    parsedData.suggestions = [];
}

        } catch (err) {

            console.log(err);

            return res.json({

                atsScore: 0,

                skills: ['JSON Parse Error'],

                suggestions: [cleanedText]

            });

        }

        res.json({

            atsScore: parsedData.atsScore || 75,

            skills:
    parsedData.skills.length > 0
        ? parsedData.skills
        : ['No Skills Found'],

suggestions:
    parsedData.suggestions.length > 0
        ? parsedData.suggestions
        : ['No Suggestions Found']

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            atsScore: 0,

            skills: ['Backend Error'],

            suggestions: [error.message]

        });

    }

});

app.listen(5002, () => {

    console.log('AI Service Running On Port 5002');

});