import { GoogleGenAI, GenerateContentResponse, Part, Type, Content } from "@google/genai";
import { AnalysisResult, SymptomInput, SymptomCheckResult, DailyLogEntry, SavedReport, HealthInsight, ChatMessage, UserProfile } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Switch to Gemini 2.5 Flash for significantly faster processing while maintaining high quality extraction
const MODEL_NAME = 'gemini-2.5-flash';

interface AnalysisInput {
  base64?: string;
  textContent?: string;
  mimeType: string;
}

// Maps for language names to ensure AI understands
const LANGUAGE_NAMES = {
  en: "English",
  hi: "Hindi",
  nl: "Dutch",
  ta: "Tamil"
};

export const analyzeMedicalReport = async (
  input: AnalysisInput,
  language: string = 'en'
): Promise<AnalysisResult> => {
  
  const targetLang = LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES] || "English";

  const systemPrompt = `
    You are Vitalis, a world-class advanced medical AI assistant. 
    Your goal is to analyze medical documents and visual inputs uploaded by the user.
    
    CRITICAL INSTRUCTION:
    Generate ALL text content (summary, findings interpretations, research context, advice) in ${targetLang} language.
    However, keep technical keys (like JSON keys) in English.
    
    ACCEPTED INPUTS:
    1. Medical Reports (PDF, Images of documents): Lab results, prescriptions, discharge summaries.
    2. Medical Imaging: X-rays, CT scans, MRIs.
    3. Visual Symptoms: Photos of skin conditions, wounds, injuries, or other visible symptoms.
    
    TASK:
    Analyze the provided input thoroughly.
    
    OUTPUT FORMAT:
    Provide a professional medical analysis in JSON format.
    
    If the input is NOT related to health/medicine (e.g., a picture of a car, a landscape, a non-medical document), return a polite error in the 'summary' field (in ${targetLang}) explaining that you can only analyze medical data, and return empty arrays for other fields.
    
    FOR DOCUMENTS:
    Extract specific data points (findings). Identify every distinct medical parameter.
    If the document provides a "Reference Range" or "Normal Range", extract it. If not, provide the standard medical reference range for that parameter if known.
    
    FOR VISUAL SYMPTOMS / IMAGING:
    Describe the visual observations as "findings". 
    - Parameter: Name of the observation (e.g. "Skin Lesion", "Bone Fracture").
    - Value: Description of the appearance.
    - Reference Range: "N/A" for visual descriptions, or describe the normal appearance (e.g. "Smooth skin").
    
    Assign a status: 'Normal', 'Warning' (slightly out of range/notable), 'Critical' (urgent/severely out of range), or 'Unknown'.
    Provide a short, clear interpretation for each finding in ${targetLang}.
  `;

  // Construct parts based on input type
  const parts: Part[] = [];

  if (input.base64) {
    // Handle Images and PDFs
    parts.push({
      inlineData: {
        data: input.base64,
        mimeType: input.mimeType,
      },
    });
  } else if (input.textContent) {
    // Handle Text/CSV
    parts.push({
      text: `Here is the content of the medical file (${input.mimeType}):\n\n${input.textContent}`
    });
  }

  parts.push({ text: systemPrompt });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: parts,
      },
      config: {
        // Disable thinking budget to prioritize low latency (speed) as requested
        thinkingConfig: { thinkingBudget: 0 }, 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { 
              type: Type.STRING, 
              description: `A patient-friendly summary of the overall health status in ${targetLang}.` 
            },
            findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, description: "Category of the finding (e.g. Hematology, Dermatology, Radiology)" },
                  parameter: { type: Type.STRING, description: "The name of the test, parameter, or visual observation" },
                  value: { type: Type.STRING, description: "The result value or visual description identified" },
                  unit: { type: Type.STRING, description: "The unit of measurement if applicable" },
                  referenceRange: { type: Type.STRING, description: "The normal reference range (e.g. '13.5-17.5' or '< 100') or normal appearance." },
                  status: { 
                    type: Type.STRING, 
                    enum: ["Normal", "Warning", "Critical", "Unknown"],
                    description: "Clinical assessment of the value."
                  },
                  interpretation: { type: Type.STRING, description: `Brief explanation of what this result means in ${targetLang}.` }
                },
                required: ["parameter", "status", "interpretation", "value"]
              }
            },
            researchContext: { 
              type: Type.STRING,
              description: `Detailed medical context about the conditions or markers found in ${targetLang}. Explain the 'why'.`
            },
            patientAdvice: { 
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: `List of actionable steps or questions for the doctor in ${targetLang}.`
            },
            disclaimer: { 
              type: Type.STRING,
              description: `Standard medical AI disclaimer in ${targetLang}.`
            }
          },
          required: ["summary", "findings", "researchContext", "patientAdvice"]
        }
      }
    });

    const jsonText = response.text || "{}";
    const parsedResult = JSON.parse(jsonText);

    return {
      summary: parsedResult.summary || "Could not generate summary.",
      findings: parsedResult.findings || [],
      researchContext: parsedResult.researchContext || "No context provided.",
      patientAdvice: parsedResult.patientAdvice || [],
      disclaimer: parsedResult.disclaimer || "Consult a doctor."
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw new Error("Failed to analyze the medical report. Please try again.");
  }
};

export const checkSymptoms = async (input: SymptomInput, language: string = 'en'): Promise<SymptomCheckResult> => {
  const targetLang = LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES] || "English";

  const prompt = `
    Act as an experienced triage nurse and medical AI. 
    Analyze the following patient inputs and provide a symptom assessment.

    Patient Data:
    - Symptoms: ${input.symptoms.join(', ')}
    - Duration: ${input.duration}
    - Reported Severity: ${input.severity}
    - Age/Sex: ${input.age}, ${input.sex}
    - Medical History: ${input.history || 'None provided'}
    - Recent Activity: ${input.activity || 'None provided'}

    Task:
    1. Identify 2-3 likely conditions based on the symptoms.
    2. Assess the overall severity level (Low, Medium, High). High means immediate medical attention is needed.
    3. Provide clear self-care recommendations and specific advice on when to see a doctor.

    OUTPUT LANGUAGE: ${targetLang}
    All descriptions, recommendations, and advice MUST be in ${targetLang}.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            conditions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  probability: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                  description: { type: Type.STRING, description: `In ${targetLang}` },
                  matching_symptoms: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            severity_level: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            recommendations: {
              type: Type.OBJECT,
              properties: {
                self_care: { type: Type.ARRAY, items: { type: Type.STRING, description: `In ${targetLang}` } },
                doctor_visit: { type: Type.STRING, description: `In ${targetLang}` },
                emergency: { type: Type.STRING, description: `In ${targetLang}` }
              }
            },
            disclaimer: { type: Type.STRING, description: `In ${targetLang}` }
          }
        }
      }
    });

    const jsonText = response.text || "{}";
    return JSON.parse(jsonText) as SymptomCheckResult;

  } catch (error) {
    console.error("Symptom Check Failed:", error);
    throw new Error("Unable to process symptoms at this time.");
  }
};

export const createChatSession = (
  userProfile?: UserProfile | null, 
  previousHistory: ChatMessage[] = [],
  currentAnalysis?: AnalysisResult,
  language: string = 'en'
) => {
  const targetLang = LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES] || "English";
  
  // 1. Build System Instruction with User Context
  let systemInstruction = `You are Vitalis, a dedicated and specialized medical AI assistant.
  
  LANGUAGE INSTRUCTION:
  You must ALWAYS respond in ${targetLang}.
  
  STRICT SCOPE OF OPERATION:
  You must EXCLUSIVELY answer questions related to:
  - Health and Medicine
  - Medical Reports and Diagnostics
  - Anatomy and Physiology
  - Wellness, Nutrition, and Fitness
  - Mental Health support
  - Healthcare administration (finding doctors, understanding insurance terms)
  
  HARD RESTRICTIONS (ZERO TOLERANCE):
  - Do NOT answer general knowledge questions (history, geography, pop culture, sports, etc.).
  - Do NOT generate creative writing (poems, stories) unless specifically for medical education.
  - Do NOT help with coding, math (unless dosage related), or technical tasks unrelated to health.
  - Do NOT engage in general chit-chat unrelated to the user's well-being.
  
  REFUSAL PROTOCOL:
  If a user asks about an out-of-scope topic, you must politely but firmly refuse in ${targetLang}.
  Example Refusal: "I am Vitalis, a specialized medical assistant. I can only assist with health-related inquiries."
  
  Response Guidelines:
  1. KEEP RESPONSES VERY SHORT AND CONCISE. Aim for 2-3 sentences maximum.
  2. Be direct and instant. Do not waffle.
  3. Avoid medical jargon where possible, or explain it simply.
  4. ALWAYS remind the user that you are an AI and they should consult a doctor for definitive medical advice.`;

  if (userProfile) {
    systemInstruction += `\n\nUSER CONTEXT (Remember this about the person you are talking to):
    Name: ${userProfile.name}
    Sex: ${userProfile.sex || 'Not specified'}
    Medical History: ${userProfile.healthHistory?.join(', ') || 'None provided'}
    
    Use this information to personalize your responses. However, recognize that the user might also upload reports belonging to OTHERS (e.g. family members). Use context clues to determine if they are asking about themselves or the report.`;
  }

  // 2. Prepare History in Gemini Format
  // We need to map our ChatMessage[] to Gemini's Content[]
  // We filter out internal system messages that we might use for UI but aren't real turns
  const history: Content[] = previousHistory
    .filter(msg => msg.role === 'user' || msg.role === 'model')
    .map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

  // 3. Handle Current Report Context
  if (currentAnalysis) {
     // We append the analysis context as a "user provided context" or "model thought" to guide the next response
     // Note: In strict chat mode, we rely on the message history. 
     // The UI will handle sending the initial "I have analyzed..." message.
  }

  return ai.chats.create({
    model: MODEL_NAME,
    history: history,
    config: {
      systemInstruction,
    }
  });
};

export const identifySpecialist = async (medicalContext: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Based on this medical summary: "${medicalContext}", identify the single best type of medical specialist to see (e.g. "Cardiologist", "Dermatologist", "General Practitioner"). 
        
        Return ONLY the specialist name. No other text.`,
        config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text?.trim() || "Doctors";
  } catch (e) {
    return "Doctors";
  }
};

export const findNearbyDoctors = async (medicalContext: string, lat: number, lng: number): Promise<GenerateContentResponse> => {
  return await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `The patient has the following medical situation: "${medicalContext}". 
    
    Task: Find 3 to 5 nearby medical specialists, clinics, or hospitals that are best suited to treat this specific condition. 
    Focus on highly-rated places if possible.
    
    Output:
    1. A helpful, brief introductory sentence recommending the type of specialist they should see (e.g. "You should see a Dermatologist...").
    2. A list of the places found.`,
    config: {
      thinkingConfig: { thinkingBudget: 0 },
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      }
    }
  });
};

export const generateHealthInsights = async (logs: DailyLogEntry[], reports: SavedReport[]): Promise<HealthInsight[]> => {
  const prompt = `
    Analyze the following user health data to identify patterns, risks, and improvements.

    Daily Logs (Last 30 days):
    ${JSON.stringify(logs.slice(0, 30))}

    Recent Medical Reports/Analyses:
    ${JSON.stringify(reports.map(r => ({ date: r.timestamp, summary: r.result.summary })).slice(0, 5))}

    Task:
    Generate 3-5 specific, short, actionable insights.
    Look for correlations (e.g., "High stress correlates with poor sleep").
    Look for trends (e.g., "Mood has improved over the last week").
    Look for recurring issues from reports.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["pattern", "improvement", "warning"] },
              title: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          }
        }
      }
    });

    const jsonText = response.text || "[]";
    return JSON.parse(jsonText) as HealthInsight[];
  } catch (error) {
    console.error("Insights generation failed", error);
    return [];
  }
};