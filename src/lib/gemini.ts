import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ArchitectureJSON {
  services: { name: string; type: string; description: string }[];
  databases: { name: string; type: string; description: string }[];
  apis: { name: string; endpoint: string; method: string; description: string }[];
  flows: { from: string; to: string; label: string }[];
  techStack: { category: string; technologies: string[] }[];
}

export async function analyzeArchitecture(repoInfo: any): Promise<ArchitectureJSON> {
  const prompt = `
    Analyze the following GitHub repository structure and key file contents to determine its system architecture.
    
    Repository: ${repoInfo.owner}/${repoInfo.repo}
    
    File Tree (Summary):
    ${repoInfo.importantFiles.join("\n")}
    
    Key File Contents:
    ${Object.entries(repoInfo.fileContents).map(([path, content]) => `--- ${path} ---\n${content}`).join("\n\n")}
    
    Based on this information, identify:
    1. Services (e.g., Frontend, Backend, Workers)
    2. Databases (e.g., PostgreSQL, Redis, MongoDB)
    3. APIs (Key endpoints or communication patterns)
    4. Data Flows (How components interact)
    5. Tech Stack (Languages, frameworks, tools)
    
    Return the result as a structured JSON object.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          services: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["name", "type", "description"]
            }
          },
          databases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["name", "type", "description"]
            }
          },
          apis: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                endpoint: { type: Type.STRING },
                method: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["name", "endpoint", "method", "description"]
            }
          },
          flows: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                from: { type: Type.STRING },
                to: { type: Type.STRING },
                label: { type: Type.STRING }
              },
              required: ["from", "to", "label"]
            }
          },
          techStack: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                technologies: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["category", "technologies"]
            }
          }
        },
        required: ["services", "databases", "apis", "flows", "techStack"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateBlogExplanation(repoInfo: any, arch: ArchitectureJSON): Promise<string> {
  const prompt = `
    Generate a detailed, professional blog-style explanation of the system design for the following repository.
    
    Repository: ${repoInfo.owner}/${repoInfo.repo}
    Architecture: ${JSON.stringify(arch, null, 2)}
    
    The blog should include:
    1. Title
    2. Overview of the project
    3. Deep dive into the Architecture Breakdown
    4. Tech Stack Explanation (Why these choices were likely made)
    5. Data Flow Description
    6. Deployment Strategy (Based on files like Dockerfile, etc.)
    
    Use professional tone and clear Markdown formatting.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt
  });

  return response.text || "Failed to generate blog.";
}
