
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { PestIdentificationResult, TreatmentPlan, WeatherData, SoilAnalysisResult, YieldPlan, SatelliteSoilData } from "../types";

const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key not found in environment variables.");
    }
    return new GoogleGenAI({ apiKey });
};

// --- EXISTING DETECT FLOW ---
export const identifyPestFromImage = async (base64Image: string): Promise<PestIdentificationResult> => {
    const ai = getAiClient();
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    const prompt = `
    Act as an expert Plant Pathologist. Analyze the image.
    Task:
    1. Identify CROP.
    2. Identify PEST/DISEASE. If healthy, set pest_label to 'Healthy'.
    3. Confidence score (0-1).
    4. Brief 1-sentence note.
    Respond in JSON.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        crop: { type: Type.STRING },
                        pest_label: { type: Type.STRING },
                        confidence: { type: Type.NUMBER },
                        notes: { type: Type.STRING },
                    },
                    required: ["crop", "pest_label", "confidence", "notes"],
                }
            }
        });
        if (response.text) return JSON.parse(response.text) as PestIdentificationResult;
        throw new Error("Empty response");
    } catch (error) { console.error("Identify Pest Error:", error); throw error; }
};

export const generateTreatmentPlan = async (
    identification: PestIdentificationResult, 
    weather?: WeatherData,
    language: string = 'Hindi'
): Promise<TreatmentPlan> => {
    const ai = getAiClient();
    let weatherContext = weather ? `Weather: ${weather.condition}, ${weather.temperature}°C.` : "No weather data.";

    const prompt = `
    Role: 'Kisan Mitra', expert Indian agronomist.
    Language: ${language}.
    Crop: ${identification.crop}
    Disease: ${identification.pest_label}
    Weather: ${weatherContext}

    Task: Provide a treatment plan.
    - Organic Remedy (Desi Jugad).
    - Chemical Remedy (Indian Brands).
    - Safety tip.
    - Audio script (2 sentences).
    - Full explanation formatted in Markdown.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        pest_name: { type: Type.STRING },
                        pest_name_local: { type: Type.STRING },
                        severity: { type: Type.STRING, enum: ["low", "medium", "high"] },
                        organic_remedy: { type: Type.STRING },
                        chemical_remedy: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                product_brands: { type: Type.ARRAY, items: { type: Type.STRING } },
                                dosage_ml_per_litre: { type: Type.STRING },
                                frequency_days: { type: Type.STRING },
                                estimated_cost_inr: { type: Type.STRING }
                            },
                            required: ["name", "product_brands", "dosage_ml_per_litre", "frequency_days", "estimated_cost_inr"]
                        },
                        safety: { type: Type.STRING },
                        tts_short: { type: Type.STRING },
                        notes: { type: Type.STRING },
                        weather_risk_label: { type: Type.STRING, enum: ["low", "medium", "high"] },
                        weather_advice: { type: Type.STRING },
                        local_language_explanation: { type: Type.STRING }
                    },
                    required: ["pest_name", "severity", "organic_remedy", "chemical_remedy", "safety", "tts_short", "local_language_explanation"]
                }
            }
        });
        if (response.text) return JSON.parse(response.text) as TreatmentPlan;
        throw new Error("Empty treatment response");
    } catch (error) { console.error("Treatment Plan Error:", error); throw error; }
};

// --- NEW FEATURE: SOIL LAB (Hybrid Analysis) ---

export const analyzeSoilLab = async (
    mode: 'satellite' | 'vision' | 'ocr' | 'manual',
    inputData: any,
    language: string
): Promise<SoilAnalysisResult> => {
    const ai = getAiClient();
    
    let promptContext = "";
    const parts: any[] = [];

    if (mode === 'satellite') {
        const data = inputData as SatelliteSoilData;
        promptContext = `Source: Satellite Data. Region: ${data.regionProfile}. Est pH: ${data.estimatedPh}. Moisture: ${data.moisture}%. Temp: ${data.temperature}C.`;
        parts.push({ text: `Analyze this soil data. Target Language: ${language}. Context: ${promptContext}. IMPORTANT: Return all textual fields (soilType, advice, recommendations, etc.) strictly in ${language} language.` });
    } 
    else if (mode === 'vision') {
        // Visual Soil Doctor
        const cleanBase64 = inputData.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } });
        parts.push({ text: `Analyze this soil photo. Identify texture (Clay/Sandy/Loam), moisture status, and estimate pH based on color/type. Target Language: ${language}. IMPORTANT: Return all textual fields strictly in ${language} language.` });
    }
    else if (mode === 'ocr') {
        // Health Card OCR
        const cleanBase64 = inputData.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } });
        parts.push({ text: `Read this Indian Soil Health Card. Extract pH, OC, and nutrients. Provide recommendations. Target Language: ${language}. IMPORTANT: Return all textual fields strictly in ${language} language.` });
    }
    else {
        // Manual
        promptContext = `Manual Input. pH: ${inputData.ph}. Type: ${inputData.type}.`;
        parts.push({ text: `Analyze this manual soil data. Target Language: ${language}. Context: ${promptContext}. IMPORTANT: Return all textual fields strictly in ${language} language.` });
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    source: { type: Type.STRING },
                    soilType: { type: Type.STRING },
                    phLevel: { type: Type.STRING },
                    organicCarbon: { type: Type.STRING },
                    moisture: { type: Type.STRING },
                    deficiencies: { type: Type.ARRAY, items: { type: Type.STRING } },
                    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                    suitableCrops: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["soilType", "phLevel", "organicCarbon", "recommendations", "suitableCrops"]
            }
        }
    });

    const result = JSON.parse(response.text || '{}');
    return { ...result, source: mode };
};

// --- NEW FEATURE: SMART FARM (Production/Yield) ---

export const generateYieldPlan = async (
    crop: string,
    acres: string,
    season: string,
    language: string
): Promise<YieldPlan> => {
    const ai = getAiClient();
    const prompt = `
    Act as a high-yield Agricultural Consultant for India.
    Create a production maximization plan.
    
    Input:
    - Crop: ${crop}
    - Land: ${acres} Acres
    - Season: ${season}
    - Language: ${language}

    Task:
    1. Estimate yield (Quintals).
    2. Create a timeline (Sowing to Harvest).
    3. Suggest fertilizer schedule.
    4. Give 3 "Pro Tips" for max production.

    IMPORTANT: ALL textual output (stage names, tips, actions, etc.) MUST be in ${language} language.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    crop: { type: Type.STRING },
                    landSize: { type: Type.STRING },
                    season: { type: Type.STRING },
                    expectedYield: { type: Type.STRING },
                    timeline: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                stage: { type: Type.STRING },
                                action: { type: Type.STRING },
                                fertilizer: { type: Type.STRING },
                                tip: { type: Type.STRING }
                            }
                        }
                    },
                    generalTips: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["crop", "expectedYield", "timeline", "generalTips"]
            }
        }
    });

    return JSON.parse(response.text || '{}') as YieldPlan;
};

// Utils (Audio/Chat/Maps)

export const generatePestAudioExplanation = async (
    identification: PestIdentificationResult, 
    treatment: TreatmentPlan, 
    weather: WeatherData | undefined, 
    language: string
): Promise<string> => {
    const ai = getAiClient();
    const weatherContext = weather ? `Weather is ${weather.condition}, ${weather.temperature}°C.` : "";
    
    const prompt = `
    Act as Kisan Mitra (Farmer's Friend).
    Speak in ${language}.
    
    Topic: Diagnosis for ${identification.crop}.
    Issue: ${treatment.pest_name_local || treatment.pest_name} (${treatment.severity} severity).
    Advice: Use ${treatment.chemical_remedy.name} or ${treatment.organic_remedy}.
    Note: ${weatherContext} ${treatment.weather_advice || ''}.
    
    Keep it conversational, encouraging, and under 40 seconds.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                }
            }
        });

        // The API returns raw PCM data in the inlineData of the first part
        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64 || "";
    } catch (error) {
        console.error("Audio generation failed:", error);
        return "";
    }
};

export const askFollowUpQuestion = async (q: string, c: any, l: string) => {
    const ai = getAiClient();
    const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Q: ${q}. Context: ${JSON.stringify(c)}. Lang: ${l}. Keep it short.`,
        config: { tools: [{ googleSearch: {} }] }
    });
    const urls: string[] = [];
    res.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((c: any) => {
        if (c.web?.uri) urls.push(c.web.uri);
    });
    return { text: res.text || "No answer.", sourceUrls: urls };
};

export const findNearbyShops = async (lat: number, lng: number, product: string) => {
    const ai = getAiClient();
    const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find agri shops near me for ${product}`,
        config: { tools: [{ googleMaps: {} }], toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } } }
    });
    const shops: any[] = [];
    res.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((c: any) => {
        if (c.web?.uri) shops.push({ title: c.web.title || "Shop", uri: c.web.uri });
    });
    return { text: res.text || "", shops };
};
