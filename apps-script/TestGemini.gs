/**
 * Test Gemini API and list available models
 */

function listAvailableModels() {
  const apiKey = CONFIG.GEMINI_API_KEY;

  if (!apiKey) {
    Logger.log('No API key found');
    return;
  }

  // Try listing models
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const data = JSON.parse(response.getContentText());

    Logger.log('=== Available Models ===');
    if (data.models) {
      data.models.forEach(model => {
        Logger.log(`- ${model.name} (supports: ${model.supportedGenerationMethods?.join(', ')})`);
      });
    } else {
      Logger.log('Response: ' + JSON.stringify(data));
    }
  } catch (error) {
    Logger.log('Error: ' + error.message);
  }
}

function testGeminiDirectly() {
  const apiKey = CONFIG.GEMINI_API_KEY;

  // Try different model names
  const modelsToTry = [
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest',
    'gemini-pro',
    'models/gemini-1.5-flash-latest',
    'models/gemini-pro'
  ];

  for (const modelName of modelsToTry) {
    Logger.log(`\nTrying model: ${modelName}`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        parts: [{ text: 'Say hello in one word' }]
      }]
    };

    try {
      const response = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      const code = response.getResponseCode();
      const text = response.getContentText();

      Logger.log(`Status: ${code}`);
      if (code === 200) {
        Logger.log('SUCCESS! Use this model name: ' + modelName);
        Logger.log('Response: ' + text);
        return;
      } else {
        Logger.log('Error: ' + text);
      }
    } catch (error) {
      Logger.log('Exception: ' + error.message);
    }
  }
}
