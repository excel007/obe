
import { GoogleGenAI, Type } from "@google/genai";
import { Course, CLO, StakeholderInput, PLO } from "../types";

// Initialize client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelName = "gemini-2.5-flash";

// --- 1. PLO Suggestion ---
export const suggestPLOs = async (
  stakeholders: StakeholderInput[],
  programName: string,
  degree: string
): Promise<any[]> => {
  const prompt = `
    Role: Curriculum Design Expert & EdTech Architect.
    Task: Analyze Stakeholder Requirements and synthesize 5-8 Program Learning Outcomes (PLOs).
    Context: Program "${programName}", Degree "${degree}".
    Framework: OBE, TQF, AUN-QA. Language: Thai.
    
    Stakeholders Input Data: 
    ${JSON.stringify(stakeholders.map(s => ({ id: s.id, source: s.source, text: s.description })))}

    Instructions:
    1. Synthesize the needs into clear PLOs.
    2. IMPORTANT: For each PLO, identify which specific Stakeholder Input IDs contributed to it. Return these as "sourceIds".

    Output Schema (JSON Array):
    [
      {
        "code": "PLO1", 
        "description": "...", 
        "suggested_domain": "...", 
        "source_keywords": ["..."],
        "sourceIds": ["ID_FROM_INPUT_1", "ID_FROM_INPUT_2"]
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI PLO Suggestion Error:", error);
    throw error;
  }
};

// --- 2. YLO Suggestion ---
export const suggestYLOs = async (degree: string, programName: string): Promise<any[]> => {
  const prompt = `
    Role: Curriculum Expert.
    Task: Suggest Year Learning Outcomes (YLOs) for Year 1 to 4.
    Context: "${programName}" (${degree}).
    Logic:
    - Year 1: Fundamental/General
    - Year 2: Core/Technical
    - Year 3: Application/Specialization
    - Year 4: Integration/Innovation/Capstone
    Language: Thai.

    Output Schema (JSON Array):
    [
      { "year": 1, "description": "..." },
      { "year": 2, "description": "..." },
      { "year": 3, "description": "..." },
      { "year": 4, "description": "..." }
    ]
  `;
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI YLO Suggestion Error:", error);
    throw error;
  }
};

// --- 3. Course Content & Mapping ---
export const generateCourseContent = async (
  courseName: string,
  category: string,
  degreeLevel: string,
  plos: PLO[]
): Promise<{ descriptionTH: string; descriptionEN: string; clos: any[]; suggestedMappings: string[] }> => {
  
  const prompt = `
    Task: Generate course details and map to PLOs.
    Course: "${courseName}" (${category}). Level: ${degreeLevel}.
    Available PLOs: ${JSON.stringify(plos.map(p => ({ id: p.id, code: p.code, desc: p.description })))}

    Requirements:
    1. Course Description: TH and EN.
    2. CLOs: 3-5 outcomes using Bloom's verbs (Thai).
    3. Mapping: For each CLO, identify the *single best fit* PLO Code (e.g. PLO1).

    Output Schema (JSON):
    {
      "descriptionTH": "...",
      "descriptionEN": "...",
      "clos": [
        { 
          "actionVerb": "...", 
          "description": "...", 
          "bloomLevel": "...", 
          "related_plo_code": "PLO_CODE_HERE" 
        }
      ],
      "suggestedMappings": ["PLO1", "PLO3"] 
      // List of unique PLO codes that this course mainly addresses
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Course Content Error:", error);
    throw error;
  }
};

// --- 4. Gap Analysis & Course Suggestion ---
export const suggestGapFillingCourses = async (
  plos: PLO[],
  existingCourses: Course[]
): Promise<any[]> => {
  const prompt = `
    Task: Analyze PLOs and Existing Courses. Identify gaps where PLOs are not fully covered.
    PLOs: ${JSON.stringify(plos.map(p => ({ code: p.code, desc: p.description })))}
    Existing Courses: ${JSON.stringify(existingCourses.map(c => c.nameTH))}

    Action: Suggest 3-5 new Elective Courses (Specific Electives) to fill these gaps.
    Constraints:
    - Course Codes MUST start with "NEW-" followed by number (e.g. NEW-101).
    - Focus on modern topics required for PLO achievement.

    Output Schema (JSON Array):
    [
      {
        "code": "NEW-001",
        "nameTH": "...",
        "nameEN": "...",
        "credits": 3,
        "justification": "Covers PLO...",
        "target_plos": ["PLO1", "PLO5"] // List of PLO Codes this course satisfies
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Gap Analysis Error:", error);
    throw error;
  }
};

// --- 5. Module Course Suggestion ---
export const suggestModuleCourses = async (
  moduleName: string,
  moduleDescription: string,
  allCourses: Course[]
): Promise<string[]> => {
  const prompt = `
    Task: Select 3-5 courses from the list that fit into the module "${moduleName}".
    Module Description: "${moduleDescription}".
    Available Courses: ${JSON.stringify(allCourses.map(c => ({ id: c.id, name: c.nameTH })))}
    
    Return ONLY the IDs of the selected courses.
    
    Output Schema (JSON Array of Strings):
    ["ID_1", "ID_2"]
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Module Suggestion Error:", error);
    return [];
  }
}
