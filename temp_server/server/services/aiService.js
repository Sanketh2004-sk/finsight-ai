// ============================================================
// services/aiService.js — All AI Integrations
// Gemini Vision (receipt), OpenAI (chat/coach/planner), Sarvam (voice)
// ============================================================

const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");
const axios = require("axios");

// Initialize AI clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─────────────────────────────────────────────────────────────
// 1. GEMINI VISION — Receipt Scanner
// Extracts structured data from receipt images
// ─────────────────────────────────────────────────────────────

/**
 * scanReceiptWithGemini
 * How it works:
 * 1. Convert image buffer to base64
 * 2. Send to Gemini Vision with a structured prompt
 * 3. Parse the JSON response for expense fields
 *
 * @param {Buffer} imageBuffer - The image file buffer
 * @param {string} mimeType - e.g. "image/jpeg"
 * @returns {Object} Extracted receipt data
 */
const scanReceiptWithGemini = async (imageBuffer, mimeType = "image/jpeg") => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Convert buffer to base64 for Gemini
  const base64Image = imageBuffer.toString("base64");

  const prompt = `
    Analyze this receipt image and extract the following information.
    Return ONLY a valid JSON object with these exact fields (no markdown, no explanation):
    {
      "merchant": "store/restaurant name",
      "amount": 0.00,
      "tax": 0.00,
      "date": "YYYY-MM-DD",
      "category": "one of: Food & Dining, Shopping, Transportation, Entertainment, Healthcare, Utilities, Other",
      "items": ["item1", "item2"],
      "paymentMethod": "Cash/Card/UPI/Other",
      "confidence": 0.95
    }
    If a field cannot be determined, use null.
    Amount and tax should be numbers (not strings).
    Confidence should be between 0 and 1.
  `;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    },
  ]);

  const responseText = result.response.text().trim();

  // Clean up: remove markdown code blocks if present
  const cleanedJson = responseText
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const parsed = JSON.parse(cleanedJson);
  return parsed;
};

// ─────────────────────────────────────────────────────────────
// 2. OPENAI — AI Chat Assistant
// Answers questions about the user's finances
// ─────────────────────────────────────────────────────────────

/**
 * chatWithAI
 * @param {Array} messages - Chat history [{ role, content }]
 * @param {Object} userContext - User's financial summary for context
 * @returns {string} AI response
 */
const chatWithAI = async (messages, userContext) => {
  const systemPrompt = `
You are AiXpense AI, a friendly and knowledgeable personal finance assistant.
You help users understand their spending habits, savings, and financial health.

Current User Financial Context:
- Total Income this month: ₹${userContext.monthlyIncome || 0}
- Total Expenses this month: ₹${userContext.monthlyExpenses || 0}
- Balance: ₹${userContext.balance || 0}
- Top spending category: ${userContext.topCategory || "N/A"}
- Budget used: ${userContext.budgetUsed || 0}%
- Active Goals: ${userContext.activeGoals || 0}

Be concise, helpful, and use ₹ for Indian Rupees.
Never make up financial data that wasn't provided.
If asked about something outside finance, gently redirect to financial topics.
  `.trim();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // cost-effective model
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    max_tokens: 600,
    temperature: 0.7,
  });

  return response.choices[0].message.content;
};

// ─────────────────────────────────────────────────────────────
// 3. OPENAI — Spending Coach (Weekly/Monthly/Yearly Reports)
// ─────────────────────────────────────────────────────────────

/**
 * generateSpendingReport
 * @param {Object} data - Aggregated expense/income data
 * @param {string} period - "weekly" | "monthly" | "yearly"
 * @returns {Object} { summary, suggestions, overspendingAreas, positiveTrends }
 */
const generateSpendingReport = async (data, period = "monthly") => {
  const prompt = `
Analyze this ${period} financial data and generate a spending coach report.

Financial Data:
- Total Income: ₹${data.totalIncome}
- Total Expenses: ₹${data.totalExpenses}
- Savings: ₹${data.savings}
- Savings Rate: ${data.savingsRate}%
- Category Breakdown: ${JSON.stringify(data.categoryBreakdown)}
- Compared to previous ${period}: Expenses ${data.changePercent > 0 ? "increased" : "decreased"} by ${Math.abs(data.changePercent)}%

Return a JSON object with these exact fields:
{
  "summary": "2-3 sentence overview of financial health",
  "suggestions": ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"],
  "overspendingAreas": ["category1", "category2"],
  "positiveTrends": ["positive1", "positive2"],
  "weeklyTarget": 0,
  "score": 75
}
Return ONLY valid JSON, no markdown.
  `.trim();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 800,
    temperature: 0.5,
  });

  const text = response.choices[0].message.content.trim();
  const cleanedJson = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleanedJson);
};

// ─────────────────────────────────────────────────────────────
// 4. OPENAI — Financial Health Score Explanation
// ─────────────────────────────────────────────────────────────

/**
 * explainHealthScore
 * @param {number} score - Calculated score (0-100)
 * @param {Object} factors - The components that went into the score
 * @returns {string} AI explanation
 */
const explainHealthScore = async (score, factors) => {
  const prompt = `
A user's Financial Health Score is ${score}/100.

Score factors:
- Savings Rate: ${factors.savingsRate}% (weight: 30%)
- Budget Adherence: ${factors.budgetAdherence}% (weight: 25%)
- Spending Consistency: ${factors.spendingConsistency}% (weight: 20%)
- Emergency Fund: ${factors.emergencyFundScore}% (weight: 15%)
- Debt Ratio: ${factors.debtRatio}% (weight: 10%)

In 3-4 friendly sentences, explain why the score is ${score}, what they're doing well, and the top 2 things they can do to improve it. Be encouraging and specific.
  `.trim();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 300,
    temperature: 0.6,
  });

  return response.choices[0].message.content;
};

// ─────────────────────────────────────────────────────────────
// 5. OPENAI — AI Goal Planner
// Generates a monthly saving plan for a financial goal
// ─────────────────────────────────────────────────────────────

/**
 * generateGoalPlan
 * @param {Object} goal - { title, targetAmount, currentAmount, deadline }
 * @param {Object} userFinances - { monthlyIncome, monthlyExpenses }
 * @returns {Object} { monthlyTarget, suggestions, feasibility }
 */
const generateGoalPlan = async (goal, userFinances) => {
  const today = new Date();
  const deadline = new Date(goal.deadline);
  const monthsRemaining = Math.max(
    Math.ceil((deadline - today) / (1000 * 60 * 60 * 24 * 30)),
    1
  );
  const remaining = goal.targetAmount - (goal.currentAmount || 0);
  const requiredMonthly = (remaining / monthsRemaining).toFixed(2);
  const disposableIncome = userFinances.monthlyIncome - userFinances.monthlyExpenses;

  const prompt = `
A user wants to save for "${goal.title}".

Goal Details:
- Target Amount: ₹${goal.targetAmount}
- Already Saved: ₹${goal.currentAmount || 0}
- Remaining: ₹${remaining}
- Deadline: ${deadline.toDateString()} (${monthsRemaining} months away)
- Required Monthly Saving: ₹${requiredMonthly}

User's Finances:
- Monthly Income: ₹${userFinances.monthlyIncome}
- Monthly Expenses: ₹${userFinances.monthlyExpenses}
- Available for Savings: ₹${disposableIncome}

Return a JSON object:
{
  "monthlyTarget": ${requiredMonthly},
  "feasibility": "achievable" | "challenging" | "unrealistic",
  "feasibilityReason": "why it is feasible or not",
  "suggestions": ["tip1", "tip2", "tip3", "tip4"],
  "alternativePlan": "if unrealistic, suggest an alternative deadline or reduced amount"
}
Return ONLY valid JSON, no markdown.
  `.trim();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 500,
    temperature: 0.5,
  });

  const text = response.choices[0].message.content.trim();
  const cleanedJson = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleanedJson);
};

// ─────────────────────────────────────────────────────────────
// 6. SARVAM AI — Voice Expense Entry
// Parses natural language (Indian languages) into expense data
// ─────────────────────────────────────────────────────────────

/**
 * parseVoiceExpense
 * @param {Buffer} audioBuffer - Audio file buffer
 * @param {string} language - "en-IN" | "hi-IN" | "mr-IN" | "te-IN" | "ta-IN"
 * @returns {Object} { transcript, amount, category, merchant, date, description }
 */
const parseVoiceExpense = async (audioBuffer, language = "en-IN") => {
  try {
    // Step 1: Transcribe audio using Sarvam ASR (Speech-to-Text)
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: "audio/wav" });
    formData.append("file", audioBlob, "audio.wav");
    formData.append("model", "saarika:v2");
    formData.append("language_code", language);

    const transcriptResponse = await axios.post(
      `${process.env.SARVAM_API_URL}/speech-to-text`,
      formData,
      {
        headers: {
          "api-subscription-key": process.env.SARVAM_API_KEY,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const transcript = transcriptResponse.data.transcript || "";

    // Step 2: Use OpenAI to parse the transcript into structured expense data
    const parsePrompt = `
Extract expense information from this voice transcript: "${transcript}"

Return ONLY valid JSON:
{
  "amount": 0.00,
  "category": "Food & Dining",
  "merchant": "store name or null",
  "date": "today's date YYYY-MM-DD or extracted date",
  "description": "brief description",
  "confidence": 0.9
}
If no amount is found, set amount to null.
Category must be one of: Food & Dining, Shopping, Transportation, Entertainment, Healthcare, Utilities, Other.
    `.trim();

    const parseResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: parsePrompt }],
      max_tokens: 200,
      temperature: 0.2,
    });

    const parsedText = parseResponse.choices[0].message.content.trim();
    const cleanedJson = parsedText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanedJson);

    return { transcript, ...parsed };
  } catch (error) {
    console.error("Voice parsing error:", error.message);
    throw new Error("Failed to process voice input. Please try again.");
  }
};

// ─────────────────────────────────────────────────────────────
// 7. Custom Algorithm — AI Fraud Detection
// Uses Z-score analysis to detect abnormal transactions
// ─────────────────────────────────────────────────────────────

/**
 * detectFraud
 * @param {Object} newExpense - The new expense being checked
 * @param {Array} historicalExpenses - Past 3 months of expenses
 * @returns {Object} { isFraudulent, riskScore, reasons }
 */
const detectFraud = (newExpense, historicalExpenses) => {
  const reasons = [];

  // Filter historical expenses in same category
  const sameCategoryExpenses = historicalExpenses.filter(
    (e) => e.category === newExpense.category
  );

  if (sameCategoryExpenses.length < 5) {
    // Not enough history to judge
    return { isFraudulent: false, riskScore: 0, reasons: [] };
  }

  // Calculate mean and standard deviation for the category
  const amounts = sameCategoryExpenses.map((e) => e.amount);
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const variance =
    amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    amounts.length;
  const stdDev = Math.sqrt(variance);

  // Z-score: how many standard deviations is this amount from the mean?
  const zScore = stdDev > 0 ? Math.abs(newExpense.amount - mean) / stdDev : 0;

  let riskScore = 0;

  // Z-score > 3 means it's statistically abnormal (99.7% confidence)
  if (zScore > 3) {
    riskScore += 60;
    reasons.push(
      `Amount (₹${newExpense.amount}) is ${zScore.toFixed(1)} standard deviations above your average for ${newExpense.category}`
    );
  } else if (zScore > 2) {
    riskScore += 30;
    reasons.push(`Amount is unusually high for your ${newExpense.category} spending`);
  }

  // Check for unusual time (late night: 2am-5am)
  const hour = new Date(newExpense.date).getHours();
  if (hour >= 2 && hour <= 5) {
    riskScore += 20;
    reasons.push("Transaction made at an unusual time (2am-5am)");
  }

  // Check for duplicate amount/merchant in last 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentDuplicate = historicalExpenses.find(
    (e) =>
      e.amount === newExpense.amount &&
      e.merchant === newExpense.merchant &&
      new Date(e.date) > oneHourAgo
  );
  if (recentDuplicate) {
    riskScore += 40;
    reasons.push("Possible duplicate transaction detected");
  }

  return {
    isFraudulent: riskScore >= 60,
    riskScore: Math.min(riskScore, 100),
    reasons,
  };
};

// ─────────────────────────────────────────────────────────────
// 8. Simple Regression — Spending Prediction
// Predicts next month's expenses by category
// ─────────────────────────────────────────────────────────────

/**
 * predictNextMonthSpending
 * @param {Array} monthlyTotals - Last 6 months of total expenses
 * @returns {Object} { predictedTotal, predictedByCategory, trend }
 */
const predictNextMonthSpending = (monthlyTotals, categoryMonthlyData) => {
  if (monthlyTotals.length < 2) {
    return {
      predictedTotal: monthlyTotals[0] || 0,
      trend: "insufficient_data",
      predictedByCategory: {},
    };
  }

  // Simple linear regression on total monthly spending
  const n = monthlyTotals.length;
  const xValues = monthlyTotals.map((_, i) => i + 1);
  const yValues = monthlyTotals;

  const xMean = xValues.reduce((a, b) => a + b, 0) / n;
  const yMean = yValues.reduce((a, b) => a + b, 0) / n;

  const numerator = xValues.reduce(
    (sum, x, i) => sum + (x - xMean) * (yValues[i] - yMean),
    0
  );
  const denominator = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;
  const predictedTotal = Math.max(slope * (n + 1) + intercept, 0);

  const trend =
    slope > 50 ? "increasing" : slope < -50 ? "decreasing" : "stable";

  // Predict by category using rolling average (last 3 months)
  const predictedByCategory = {};
  for (const [category, values] of Object.entries(categoryMonthlyData)) {
    const recentValues = values.slice(-3);
    predictedByCategory[category] =
      recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
  }

  return {
    predictedTotal: Math.round(predictedTotal),
    trend,
    predictedByCategory,
    confidence: Math.min(0.6 + monthlyTotals.length * 0.05, 0.90),
  };
};

// ─────────────────────────────────────────────────────────────
// 9. Financial Health Score Calculator
// ─────────────────────────────────────────────────────────────

/**
 * calculateHealthScore
 * @param {Object} data - { savingsRate, budgetAdherence, spendingConsistency, emergencyFundMonths, debtAmount, monthlyIncome }
 * @returns {Object} { score, factors, grade }
 */
const calculateHealthScore = (data) => {
  // 1. Savings Rate (30 pts): 20%+ is excellent
  const savingsScore = Math.min((data.savingsRate / 20) * 30, 30);

  // 2. Budget Adherence (25 pts): staying under budget = higher score
  const budgetScore = Math.min(data.budgetAdherence * 0.25, 25);

  // 3. Spending Consistency (20 pts): low variance = consistent spending
  const consistencyScore = Math.min(data.spendingConsistency * 0.2, 20);

  // 4. Emergency Fund (15 pts): 6 months = full score
  const emergencyScore = Math.min((data.emergencyFundMonths / 6) * 15, 15);

  // 5. Debt Ratio (10 pts): debt/income ratio below 30% is good
  const debtRatio =
    data.monthlyIncome > 0 ? (data.debtAmount / data.monthlyIncome) * 100 : 0;
  const debtScore = Math.max(10 - (debtRatio / 30) * 10, 0);

  const totalScore = Math.round(
    savingsScore + budgetScore + consistencyScore + emergencyScore + debtScore
  );

  const grade =
    totalScore >= 80
      ? "A"
      : totalScore >= 65
      ? "B"
      : totalScore >= 50
      ? "C"
      : totalScore >= 35
      ? "D"
      : "F";

  return {
    score: Math.min(totalScore, 100),
    grade,
    factors: {
      savingsRate: Math.round(savingsScore),
      budgetAdherence: Math.round(budgetScore),
      spendingConsistency: Math.round(consistencyScore),
      emergencyFundScore: Math.round(emergencyScore),
      debtRatio: Math.round(debtScore),
    },
  };
};

module.exports = {
  scanReceiptWithGemini,
  chatWithAI,
  generateSpendingReport,
  explainHealthScore,
  generateGoalPlan,
  parseVoiceExpense,
  detectFraud,
  predictNextMonthSpending,
  calculateHealthScore,
};
