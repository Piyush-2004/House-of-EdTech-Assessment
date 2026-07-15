import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "./db";
import * as crypto from "node:crypto";

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Helper to generate SHA-256 hash of JD + Resume
function getCacheHash(jdText: string, resumeText: string): string {
  return crypto
    .createHash("sha256")
    .update(`${jdText.trim()}|||${resumeText.trim()}`)
    .digest("hex");
}

export interface QuestionDefinition {
  questionText: string;
  expectedKeywords: string; // Comma-separated list
  difficulty: string; // "easy" | "medium" | "hard"
  category: string; // "technical" | "behavioral" | "situational"
}

export interface JdAnalysisResult {
  title: string;
  company: string;
  skills: string[];
  questions: QuestionDefinition[];
}

/**
 * Analyzes the Job Description and Candidate Resume to generate a tailored interview question bank.
 * Leverages PostgreSQL JdCache table for optimization.
 */
export async function analyzeJdAndGenerateQuestions(
  jdText: string,
  resumeText: string,
  questionCount: number = 5
): Promise<JdAnalysisResult> {
  const hash = getCacheHash(jdText, resumeText);

  // 1. Check Cache
  try {
    const cached = await prisma.jdCache.findUnique({
      where: { hash },
    });

    if (cached) {
      console.log("JdCache Hit! Returning cached questions.");
      return {
        title: cached.title,
        company: cached.company,
        skills: cached.skills.split(",").map((s) => s.trim()),
        questions: JSON.parse(cached.questions),
      };
    }
  } catch (dbError) {
    console.error("Cache read failed, proceeding to generate content:", dbError);
  }

  // 2. Generate if not cached
  let result: JdAnalysisResult;

  if (!genAI) {
    console.warn("GEMINI_API_KEY is missing. Generating high-quality mock data.");
    result = generateMockJdAnalysis(jdText, resumeText, questionCount);
  } else {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        You are an expert full-stack technical recruiter and technical interviewer.
        Analyze the following Job Description (JD) and Candidate Resume to extract key info and generate a tailored mock interview.

        Job Description:
        """
        ${jdText}
        """

        Candidate Resume:
        """
        ${resumeText}
        """

        Please perform the following:
        1. Extract the Job Title (defaults to "Software Engineer" if unclear).
        2. Extract the Company Name (defaults to "Target Company" if unclear).
        3. Identify 5-8 key technical or soft skills mentioned in the JD that are relevant to this candidate.
        4. Generate exactly ${questionCount} tailored mock interview questions. 
           - The questions must assess the alignment of the candidate's resume against the JD requirements.
           - Balance technical questions with behavioral/situational questions based on the JD.
           - For each question, specify:
             - questionText (the prompt asked to the user)
             - expectedKeywords (a comma-separated string of terms, tools, or concepts they should mention in their answer)
             - difficulty ("easy", "medium", or "hard")
             - category ("technical", "behavioral", or "situational")

        You MUST respond ONLY with a valid JSON object matching the following TypeScript schema:
        {
          "title": string,
          "company": string,
          "skills": string[],
          "questions": Array<{
            "questionText": string,
            "expectedKeywords": string,
            "difficulty": "easy" | "medium" | "hard",
            "category": "technical" | "behavioral" | "situational"
          }>
        }
      `;

      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const text = response.response.text();
      result = JSON.parse(text);

      // Simple structural guardrails
      if (!result.title || !Array.isArray(result.questions)) {
        throw new Error("Invalid schema returned by Gemini API");
      }
    } catch (apiError) {
      console.error("Gemini API call failed, using mock fallback:", apiError);
      result = generateMockJdAnalysis(jdText, resumeText, questionCount);
    }
  }

  // 3. Save to Cache
  try {
    await prisma.jdCache.create({
      data: {
        hash,
        title: result.title,
        company: result.company,
        skills: result.skills.join(", "),
        questions: JSON.stringify(result.questions),
      },
    });
  } catch (dbWriteError) {
    console.error("Failed to write to JdCache:", dbWriteError);
  }

  return result;
}

export interface ScoreResult {
  score: number; // 0 to 100
  feedback: string;
  matchingScore: number; // 0 to 100
  gapAnalysis: string;
}

/**
 * Scores a candidate's answer against the interview question and JD context.
 */
export async function scoreAnswer(
  questionText: string,
  answerText: string,
  jdText: string,
  expectedKeywords: string
): Promise<ScoreResult> {
  if (!answerText || answerText.trim() === "") {
    return {
      score: 0,
      feedback: "No answer was provided for this question.",
      matchingScore: 0,
      gapAnalysis: "The question was skipped.",
    };
  }

  if (!genAI) {
    return generateMockAnswerScoring(questionText, answerText, expectedKeywords);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an expert technical interviewer grading a mock interview answer.
      Evaluate the candidate's answer against the question and the original Job Description (JD).

      Job Description:
      """
      ${jdText}
      """

      Question:
      "${questionText}"

      Expected keywords/concepts to look for in candidate answer:
      "${expectedKeywords}"

      Candidate's Answer:
      """
      ${answerText}
      """

      Evaluate the response and output a JSON object containing:
      1. "score": A numeric evaluation score from 0 to 100 reflecting correctness, depth, and clarity.
      2. "feedback": A detailed, encouraging feedback paragraph explaining what they did well and where their answer fell short.
      3. "matchingScore": A numeric score from 0 to 100 representing how well they matched the expected keywords/concepts.
      4. "gapAnalysis": A brief sentence highlighting any technical, concept, or logic gaps in their answer.

      You MUST respond ONLY with a valid JSON object matching the following schema:
      {
        "score": number,
        "feedback": string,
        "matchingScore": number,
        "gapAnalysis": string
      }
    `;

    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.15,
      },
    });

    const result: ScoreResult = JSON.parse(response.response.text());

    // Guardrail: Validate score bounds
    result.score = Math.min(100, Math.max(0, Number(result.score) || 0));
    result.matchingScore = Math.min(100, Math.max(0, Number(result.matchingScore) || 0));

    return result;
  } catch (error) {
    console.error("Failed to score answer via Gemini, using mock grading:", error);
    return generateMockAnswerScoring(questionText, answerText, expectedKeywords);
  }
}

export interface SessionSummaryResult {
  feedbackSummary: string;
  gapAnalysis: string;
  overallScore: number;
}

/**
 * Generates an overall gap report and interview feedback summary at the end of a session.
 */
export async function generateSessionReport(
  answersList: Array<{ questionText: string; answerText: string; score: number; feedback: string }>,
  jdText: string,
  resumeText: string
): Promise<SessionSummaryResult> {
  const avgScore = answersList.length
    ? Math.round(answersList.reduce((acc, q) => acc + q.score, 0) / answersList.length)
    : 0;

  if (!genAI) {
    return {
      feedbackSummary: "Mock summary: You demonstrated a decent conceptual grasp of fullstack patterns. Keep practicing system design.",
      gapAnalysis: "Mock analysis: Discrepancies exist in containerization, SQL index tuning, and CI/CD pipelines.",
      overallScore: avgScore,
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an expert career coach and recruiter. Summarize the performance of the candidate's mock interview session.

      Job Description:
      """
      ${jdText}
      """

      Candidate's Resume:
      """
      ${resumeText}
      """

      Interview performance details (Questions, Answers, Scores, and Feedbacks):
      ${JSON.stringify(answersList)}

      Please generate:
      1. A detailed feedbackSummary (2-3 sentences) explaining their performance, core strengths shown, and communication style.
      2. A gapAnalysis (2-3 bullet points or short paragraph) specifying exactly which key technologies, architectural principles, or soft skills from the JD are missing in the candidate's profile/answers and what study topics they should prioritize.

      You MUST respond ONLY with a valid JSON object matching the following schema:
      {
        "feedbackSummary": string,
        "gapAnalysis": string
      }
    `;

    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const result: { feedbackSummary: string; gapAnalysis: string } = JSON.parse(
      response.response.text()
    );

    return {
      feedbackSummary: result.feedbackSummary,
      gapAnalysis: result.gapAnalysis,
      overallScore: avgScore,
    };
  } catch (error) {
    console.error("Failed to generate overall report, fallback applied:", error);
    return {
      feedbackSummary: `Completed mock interview. Your overall score is ${avgScore}%. Focus on expanding details in technical responses.`,
      gapAnalysis: "Identified knowledge gaps in database optimizations, testing procedures, and edge-cases handling.",
      overallScore: avgScore,
    };
  }
}

/* ============================================================================
   FALLBACK MOCK GENERATION HELPERS
   ============================================================================ */

function generateMockJdAnalysis(
  jdText: string,
  resumeText: string,
  questionCount: number
): JdAnalysisResult {
  // Extract mock title/company from keywords
  let title = "Software Engineer";
  let company = "Tech Innovators";

  const lowerJd = jdText.toLowerCase();
  if (lowerJd.includes("next.js") || lowerJd.includes("react")) title = "Frontend Engineer";
  if (lowerJd.includes("node") || lowerJd.includes("express")) title = "Backend Engineer";
  if (lowerJd.includes("full stack") || lowerJd.includes("fullstack")) title = "Fullstack Developer";

  // Mock list of skills
  const skills = ["TypeScript", "Next.js", "React.js", "PostgreSQL", "Tailwind CSS", "RESTful APIs"];

  // Mock list of generic, high-quality fullstack questions
  const mockQuestions: QuestionDefinition[] = [
    {
      questionText: "How do you handle state management in a Next.js application, especially when sharing state between client and server components?",
      expectedKeywords: "React Context, Server Components, Redux, Zustand, Query Params, cookies",
      difficulty: "medium",
      category: "technical",
    },
    {
      questionText: "Can you explain how you would design a secure JWT authentication flow in a Node/Next.js stack, protecting routes and managing session lifecycles?",
      expectedKeywords: "JWT, HTTP-only cookie, secure flags, CORS, Next.js Middleware, bcrypt",
      difficulty: "hard",
      category: "technical",
    },
    {
      questionText: "Describe a situation where you had to optimize a slow database query. What steps did you take to troubleshoot and resolve it?",
      expectedKeywords: "indexes, EXPLAIN, execution plans, connection pool, Prisma, caching, PostgreSQL",
      difficulty: "medium",
      category: "technical",
    },
    {
      questionText: "What are your strategies for ensuring web application accessibility (a11y) and responsiveness across desktop and mobile browsers?",
      expectedKeywords: "semantic HTML, ARIA labels, screen readers, Tailwind media queries, flexbox, grid",
      difficulty: "easy",
      category: "situational",
    },
    {
      questionText: "Tell me about a time you had a technical disagreement with a team member. How did you handle it and what was the outcome?",
      expectedKeywords: "collaboration, constructive dialogue, trade-offs, code reviews, design docs",
      difficulty: "easy",
      category: "behavioral",
    },
  ];

  // Slice questions to match the count, wrap if count is larger
  const selectedQuestions: QuestionDefinition[] = [];
  for (let i = 0; i < questionCount; i++) {
    selectedQuestions.push(mockQuestions[i % mockQuestions.length]);
  }

  return {
    title,
    company,
    skills,
    questions: selectedQuestions,
  };
}

function generateMockAnswerScoring(
  questionText: string,
  answerText: string,
  expectedKeywords: string
): ScoreResult {
  const answerLower = answerText.toLowerCase();
  const keywords = expectedKeywords.split(",").map((k) => k.trim().toLowerCase());

  let matchedCount = 0;
  keywords.forEach((keyword) => {
    if (answerLower.includes(keyword)) {
      matchedCount++;
    }
  });

  const matchRatio = keywords.length ? matchedCount / keywords.length : 0.5;
  const score = Math.round(50 + matchRatio * 40 + Math.min(10, answerText.length / 50)); // basic heuristics
  const matchingScore = Math.round(matchRatio * 100);

  let feedback = "";
  let gapAnalysis = "";

  if (score > 80) {
    feedback = "Excellent answer! You covered the core principles clearly and used appropriate industry terminology.";
    gapAnalysis = "No major gaps found in your explanation.";
  } else if (score > 60) {
    feedback = "Good response. You addressed the general prompt well but missed a few specific details or keywords that would strengthen the technical depth.";
    gapAnalysis = "Missed some deep-dive terms like: " + keywords.filter((k) => !answerLower.includes(k)).slice(0, 2).join(", ");
  } else {
    feedback = "The answer was a bit brief or lacked focus. Try to provide concrete examples from your past projects and mention structural methodologies.";
    gapAnalysis = "Needs a clearer understanding of the core concepts, specifically " + keywords.slice(0, 2).join(" and ");
  }

  return {
    score,
    feedback,
    matchingScore,
    gapAnalysis,
  };
}
