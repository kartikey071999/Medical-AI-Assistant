import { GoogleGenAI, GenerateContentResponse, Part, Type } from "@google/genai";
import { AnalysisResult, SymptomInput, SymptomCheckResult, DailyLogEntry, SavedReport, HealthInsight } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Switch to Gemini 2.5 Flash for significantly faster processing while maintaining high quality extraction
const MODEL_NAME = 'gemini-2.5-flash';

interface AnalysisInput {
  base64?: string;
  textContent?: string;
  mimeType: string;
}

export const analyzeMedicalReport = async (
  input: AnalysisInput
): Promise<AnalysisResult> => {
  
  const systemPrompt = `
    You are Vitalis, a world-class advanced medical AI assistant. 
    Your goal is to analyze medical documents and visual inputs uploaded by the user.
    
    ACCEPTED INPUTS:
    1. Medical Reports (PDF, Images of documents): Lab results, prescriptions, discharge summaries.
    2. Medical Imaging: X-rays, CT scans, MRIs.
    3. Visual Symptoms: Photos of skin conditions, wounds, injuries, or other visible symptoms.
    
    TASK:
    Analyze the provided input thoroughly.
    
    OUTPUT FORMAT:
    Provide a professional medical analysis in JSON format.
    
    If the input is NOT related to health/medicine (e.g., a picture of a car, a landscape, a non-medical document), return a polite error in the 'summary' field explaining that you can only analyze medical data, and return empty arrays for other fields.
    
    FOR DOCUMENTS:
    Extract specific data points (findings). Identify every distinct medical parameter.
    If the document provides a "Reference Range" or "Normal Range", extract it. If not, provide the standard medical reference range for that parameter if known.
    
    FOR VISUAL SYMPTOMS / IMAGING:
    Describe the visual observations as "findings". 
    - Parameter: Name of the observation (e.g. "Skin Lesion", "Bone Fracture").
    - Value: Description of the appearance.
    - Reference Range: "N/A" for visual descriptions, or describe the normal appearance (e.g. "Smooth skin").
    
    Assign a status: 'Normal', 'Warning' (slightly out of range/notable), 'Critical' (urgent/severely out of range), or 'Unknown'.
    Provide a short, clear interpretation for each finding.
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
              description: "A patient-friendly summary of the overall health status based on the report or image." 
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
                  interpretation: { type: Type.STRING, description: "Brief explanation of what this result means." }
                },
                required: ["parameter", "status", "interpretation", "value"]
              }
            },
            researchContext: { 
              type: Type.STRING,
              description: "Detailed medical context about the conditions or markers found. Explain the 'why'."
            },
            patientAdvice: { 
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of actionable steps or questions for the doctor."
            },
            disclaimer: { 
              type: Type.STRING,
              description: "Standard medical AI disclaimer."
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

export const checkSymptoms = async (input: SymptomInput): Promise<SymptomCheckResult> => {
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
                  description: { type: Type.STRING },
                  matching_symptoms: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            severity_level: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            recommendations: {
              type: Type.OBJECT,
              properties: {
                self_care: { type: Type.ARRAY, items: { type: Type.STRING } },
                doctor_visit: { type: Type.STRING },
                emergency: { type: Type.STRING }
              }
            },
            disclaimer: { type: Type.STRING }
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

export const createChatSession = (resultContext?: AnalysisResult) => {
  let systemInstruction = `You are Vitalis, a helpful, empathetic, and professional medical AI assistant.
  Your goal is to answer the user's questions about health, medicine, or their medical reports.
  
  Important Rules:
  1. KEEP RESPONSES VERY SHORT AND CONCISE. Aim for 2-3 sentences maximum.
  2. Be direct and instant. Do not waffle.
  3. Avoid medical jargon where possible, or explain it simply.
  4. ALWAYS remind the user that you are an AI and they should consult a doctor for definitive medical advice.`;

  if (resultContext) {
    systemInstruction += `\n\nCONTEXT: The user has uploaded a medical report or image. Here is the analysis of that input:
    Summary: ${resultContext.summary}
    Findings: ${JSON.stringify(resultContext.findings)}
    Research: ${resultContext.researchContext}
    
    Use this context to answer specific questions about their results. If they ask about a specific value (e.g. "Is my Iron low?"), refer to the findings provided above.`;
  }

  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction,
    }
  });
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
