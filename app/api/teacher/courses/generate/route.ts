export const dynamic = 'force-dynamic';

import { type NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';

const DEFAULT_SETTINGS = {
  aiEnabled: true,
  aiModel: "gemini-1.5-flash",
  geminiApiKey: process.env.GEMINI_API_KEY || ""
};

export async function POST(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', '/api/teacher/courses/generate [POST]');

  try {
    // 1. Verify User Authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.endSpan(spanId, 'error', { message: 'Missing Authorization header' });
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    
    // Check if the user is a teacher or admin
    if (decodedToken.role !== 'teacher' && decodedToken.role !== 'admin') {
      traceLogger.endSpan(spanId, 'error', { message: 'Forbidden' });
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const db = getAdminDb();

    // Check teacher-specific permission if role is teacher
    if (decodedToken.role === 'teacher') {
      const teacherDoc = await db.collection('users').doc(decodedToken.uid).get();
      const isTeacherAiEnabled = teacherDoc.exists ? !!teacherDoc.data()?.aiEnabled : false;
      if (!isTeacherAiEnabled) {
        traceLogger.endSpan(spanId, 'error', { message: 'Teacher does not have individual AI access' });
        return NextResponse.json({ 
          success: false, 
          error: 'AI Course creation features are not enabled on your account. Please connect with the administrator to enable AI features.' 
        }, { status: 403 });
      }
    }

    // 2. Load Global AI Settings
    const settingsDoc = await db.collection('system_settings').doc('global').get();

    let settings = { ...DEFAULT_SETTINGS };
    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      settings.aiEnabled = data?.aiEnabled ?? DEFAULT_SETTINGS.aiEnabled;
      settings.aiModel = data?.aiModel ?? DEFAULT_SETTINGS.aiModel;
      settings.geminiApiKey = data?.geminiApiKey || DEFAULT_SETTINGS.geminiApiKey;
    }

    if (!settings.aiEnabled) {
      traceLogger.endSpan(spanId, 'error', { message: 'AI course generation is disabled by admin' });
      return NextResponse.json({ success: false, error: 'AI course generation is currently disabled by the administrator.' }, { status: 403 });
    }

    const apiKey = settings.geminiApiKey;
    if (!apiKey) {
      traceLogger.endSpan(spanId, 'error', { message: 'Gemini API Key is not configured' });
      return NextResponse.json({ success: false, error: 'AI API Key is not configured. Please contact the administrator.' }, { status: 500 });
    }

    // 3. Parse Request Payload
    const body = await request.json();
    const { prompt, learningLanguage, nativeLanguage, difficulty } = body;

    if (!prompt || !learningLanguage || !nativeLanguage) {
      traceLogger.endSpan(spanId, 'error', { message: 'Missing required generation parameters' });
      return NextResponse.json({ success: false, error: 'Missing required parameters: prompt, learningLanguage, and nativeLanguage are required.' }, { status: 400 });
    }

    // 4. Construct Gemini API Request
    const model = settings.aiModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const promptText = `You are an expert curriculum designer and language teacher.
Create a structured course outline for teaching the target language (abbreviation: "${learningLanguage}") to students who speak the native language (abbreviation: "${nativeLanguage}").
The difficulty level is ${difficulty || 'beginner'}.
Specific topic/request: "${prompt}"

Format the response exactly as a JSON object matching the following structure:
{
  "title": "A short, catchy, professional title for the course",
  "description": "A detailed description explaining what students will learn, the methodology, and benefits (minimum 10 characters)",
  "shortDescription": "A quick one-line summary of the course",
  "difficulty": "${difficulty || 'beginner'}",
  "estimatedDuration": 5,
  "tags": ["tag1", "tag2"],
  "lessons": [
    {
      "title": "Lesson Title",
      "type": "text",
      "content": {
        "text": "A brief summary or text outline for this lesson (only required if type is 'text')"
      }
    },
    {
      "title": "Lesson Title",
      "type": "video",
      "content": {
        "videoUrl": "https://www.youtube.com/embed/placeholder"
      }
    },
    {
      "title": "Lesson Title",
      "type": "quiz",
      "content": {
        "questions": [
          {
            "question": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0,
            "explanation": "Why this option is correct",
            "points": 1
          }
        ]
      }
    }
  ]
}

Ensure to provide 3 to 6 lessons in the outline.
Ensure all descriptions, titles, questions, options, and instruction texts are written in the native language (abbreviation: "${nativeLanguage}") so that the student understands it, EXCEPT for specific vocabulary, target words, or phrases being taught, which should be in the target language (abbreviation: "${learningLanguage}").`;

    const responseSchema = {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        description: { type: "STRING" },
        shortDescription: { type: "STRING" },
        difficulty: { type: "STRING" },
        estimatedDuration: { type: "INTEGER" },
        tags: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        lessons: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              type: { type: "STRING" },
              content: {
                type: "OBJECT",
                properties: {
                  text: { type: "STRING" },
                  videoUrl: { type: "STRING" },
                  questions: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        question: { type: "STRING" },
                        options: {
                          type: "ARRAY",
                          items: { type: "STRING" }
                        },
                        correctAnswer: { type: "INTEGER" },
                        explanation: { type: "STRING" },
                        points: { type: "INTEGER" }
                      },
                      required: ["question", "options", "correctAnswer", "points"]
                    }
                  }
                }
              }
            },
            required: ["title", "type", "content"]
          }
        }
      },
      required: ["title", "description", "shortDescription", "difficulty", "estimatedDuration", "tags", "lessons"]
    };

    const apiBody = {
      contents: [
        {
          parts: [
            { text: promptText }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    };

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(apiBody)
    });

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error("Gemini API Error:", geminiData);
      traceLogger.endSpan(spanId, 'error', { message: 'Gemini API call failed' });
      return NextResponse.json({ success: false, error: geminiData.error?.message || 'Failed to communicate with AI generation service.' }, { status: geminiRes.status });
    }

    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      traceLogger.endSpan(spanId, 'error', { message: 'Empty response from Gemini' });
      return NextResponse.json({ success: false, error: 'AI returned an empty response.' }, { status: 500 });
    }

    const generatedCourse = JSON.parse(responseText);

    traceLogger.endSpan(spanId, 'success');
    return NextResponse.json({ success: true, data: generatedCourse }, { status: 200 });
  } catch (error: any) {
    traceLogger.endSpan(spanId, 'error', { message: error.message });
    return NextResponse.json({ success: false, error: error.message || 'Failed to generate course outline' }, { status: 500 });
  }
}
