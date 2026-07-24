require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
const OPENROUTER_BASE_URL = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');

async function queryAI(prompt, systemPrompt = '') {
  try {
    if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is not configured');
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Livestock Health Monitoring'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const result = {
      content: data.choices?.[0]?.message?.content,
      model: data.model,
      usage: data.usage
    };
    if (!result.content || !String(result.content).trim()) throw new Error('OpenRouter returned empty content');
    return result;
  } catch (error) {
    console.error('AI query failed:', error.message);
    throw new Error('AI service temporarily unavailable');
  }
}

async function analyzeLivestockHealth(animalData) {
  const systemPrompt = `You are a veterinary AI specialist. Analyze livestock health data and provide professional assessments.
  Format your response with clear sections: Summary, Risk Assessment, Recommendations, and Urgency Level (Low/Medium/High/Critical).`;

  const prompt = `Analyze the following livestock health data and provide a detailed health assessment:
  ${JSON.stringify(animalData, null, 2)}`;

  return queryAI(prompt, systemPrompt);
}

async function predictDisease(symptoms, animalType, history) {
  const systemPrompt = `You are a veterinary disease prediction AI. Based on symptoms and animal history, predict potential diseases.
  Format response with: Likely Diseases (ranked by probability), Symptoms Analysis, Recommended Tests, Immediate Actions, and Prevention Measures.`;

  const prompt = `Predict potential diseases for the following case:
  Animal Type: ${animalType}
  Symptoms: ${JSON.stringify(symptoms)}
  Medical History: ${JSON.stringify(history)}`;

  return queryAI(prompt, systemPrompt);
}

async function optimizeFeed(animalData, currentFeed) {
  const systemPrompt = `You are a livestock nutrition AI specialist. Provide optimal feed recommendations.
  Format response with: Current Assessment, Recommended Diet, Nutritional Gaps, Cost Optimization, and Expected Outcomes.`;

  const prompt = `Optimize feed plan for:
  Animal Data: ${JSON.stringify(animalData)}
  Current Feed: ${JSON.stringify(currentFeed)}`;

  return queryAI(prompt, systemPrompt);
}

async function breedingRecommendation(animalData) {
  const systemPrompt = `You are a livestock breeding AI specialist. Provide breeding recommendations based on genetics and health.
  Format response with: Breeding Readiness, Genetic Analysis, Recommended Pairings, Optimal Timing, and Risk Factors.`;

  const prompt = `Provide breeding recommendations for:
  ${JSON.stringify(animalData, null, 2)}`;

  return queryAI(prompt, systemPrompt);
}

async function financialAnalysis(financialData) {
  const systemPrompt = `You are a livestock farm financial AI analyst. Analyze costs, revenue, and provide optimization recommendations.
  Format response with: Financial Summary, Cost Breakdown, Revenue Analysis, ROI Assessment, and Optimization Recommendations.`;

  const prompt = `Analyze the following farm financial data:
  ${JSON.stringify(financialData, null, 2)}`;

  return queryAI(prompt, systemPrompt);
}

async function milkProductionAnalysis(productionData) {
  const systemPrompt = `You are a dairy production AI specialist. Analyze milk production data and provide optimization strategies.
  Format response with: Production Summary, Trend Analysis, Quality Assessment, Optimization Strategies, and Projected Improvements.`;

  const prompt = `Analyze milk production data:
  ${JSON.stringify(productionData, null, 2)}`;

  return queryAI(prompt, systemPrompt);
}

module.exports = {
  queryAI,
  analyzeLivestockHealth,
  predictDisease,
  optimizeFeed,
  breedingRecommendation,
  financialAnalysis,
  milkProductionAnalysis
};
