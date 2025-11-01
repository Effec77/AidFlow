import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// --- App.js content starts here ---
const App = () => {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // This is a placeholder function to simulate a scraping backend.
  // In a real application, this would be an API call to a service
  // that scrapes news articles based on a given keyword.
  const scrapeMockData = (searchKeyword) => {
    // This is hardcoded mock data for demonstration purposes.
    // In a real application, this would be a dynamic array of scraped text.
    const mockData = [
      "Heavy monsoon rains cause severe flooding in Mumbai, disrupting train services.",
      "An earthquake of magnitude 5.2 shakes parts of northern India, centered near Leh.",
      "A massive wildfire breaks out in the forests of Uttarakhand, local authorities issue evacuation orders.",
      "Cyclone Amphan makes landfall in West Bengal, causing widespread damage and power outages.",
      "Landslide blocks a major highway in the mountainous region of Himachal Pradesh, stranding hundreds of vehicles."
    ];
    return mockData.filter(text => text.toLowerCase().includes(searchKeyword.toLowerCase()));
  };

  const processDataWithGemini = async (textSnippets) => {
    setLoading(true);
    setError(null);
    setResults([]);

    // The prompt is carefully crafted to instruct the model on its task.
    // It is given the role of a disaster text classifier.
    const prompt = `You are a highly-accurate disaster text classifier. Your task is to analyze the following text snippets and, for each one, identify the most relevant disaster type and the specific location mentioned. If a location is not mentioned, use 'Not specified'.

Text Snippets:
${textSnippets.map((text, index) => `${index + 1}. ${text}`).join('\n')}

Analyze each snippet and provide a structured JSON array. Do not include any text or explanations outside the JSON. The JSON should be an array of objects, with each object containing 'disasterType' and 'location' properties.`;
    
    // The generationConfig with responseSchema ensures the model returns a predictable JSON structure.
    const generationConfig = {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            "disasterType": { "type": "STRING" },
            "location": { "type": "STRING" }
          },
          "propertyOrdering": ["disasterType", "location"]
        }
      }
    };

    let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = { contents: chatHistory, generationConfig };
    const apiKey = ""; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      const result = await response.json();
      
      // The Gemini API response is wrapped in a complex object. We need to parse it.
      const jsonText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!jsonText) {
        throw new Error("Invalid response format from API.");
      }
      const parsedJson = JSON.parse(jsonText);
      setResults(parsedJson);

    } catch (err) {
      console.error("Error processing data:", err);
      setError("An error occurred while processing the data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!keyword) return;
    const scrapedData = scrapeMockData(keyword);
    if (scrapedData.length > 0) {
      processDataWithGemini(scrapedData);
    } else {
      setResults([]);
      setError("No matching news snippets found for the given keyword.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-inter p-8 flex flex-col items-center">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center text-indigo-400 mb-6">NLP Disaster Classifier</h1>
        <p className="text-center text-gray-400 mb-8">
          Enter a keyword to simulate scraping news snippets and use the Gemini API to classify disaster types and locations.
        </p>
        
        <form onSubmit={handleSubmit} className="flex gap-4 mb-8">
          <input
            type="text"
            className="flex-grow p-3 rounded-xl bg-gray-700 text-white placeholder-gray-500 border border-gray-600 focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 transition duration-200"
            placeholder='e.g., "disasters in india"'
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition duration-200"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Analyze Snippets'}
          </button>
        </form>

        {error && (
          <div className="p-4 bg-red-800 text-red-200 rounded-xl mb-6">{error}</div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-indigo-300">Analysis Results</h2>
            {results.map((item, index) => (
              <div key={index} className="bg-gray-700 p-6 rounded-xl shadow-md border-l-4 border-indigo-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="text-lg font-medium text-white">
                    <span className="text-gray-400">Disaster Type:</span> {item.disasterType}
                  </div>
                  <div className="text-lg font-medium text-white mt-2 md:mt-0">
                    <span className="text-gray-400">Location:</span> {item.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
// --- App.js content ends here ---

// --- index.js content starts here ---
const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// --- index.js content ends here ---
