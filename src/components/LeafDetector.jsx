import React, { useState } from 'react';

export default function TomatoLeafDiseaseDetector() {
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate image type and size (5MB max)
    if (!selectedFile.type.match('image.*')) {
      setError('Please upload an image file (JPEG, PNG)');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setError(null);
    setFile(selectedFile);
    setResult(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDetect = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result.replace(/^data:image\/[a-z]+;base64,/, ''));
        };
        reader.readAsDataURL(file);
      });

      const response = await fetch('https://serverless.roboflow.com/infer/workflows/mythili-btkov/custom-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: 'wU72KMaUHJiPIQ2sCK7d',
          inputs: {
            image: {
              type: 'base64',
              value: base64,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Detection error:', err);
      setError(err.message || 'Failed to detect disease. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDiseaseInfo = (diseaseClass) => {
    const diseaseDatabase = {
      "Spotted_Wilt virus": {
        description: "Tomato spotted wilt virus (TSWV) causes bronzing of young leaves, stunted growth, and ring spots on fruits. Often spread by thrips.",
        symptoms: [
          "Bronze or dark spots on leaves",
          "Yellow ring patterns",
          "Stunted plant growth",
          "Deformed fruits"
        ],
        treatment: [
          "Remove and destroy infected plants",
          "Apply insecticides for thrips control",
          "Use reflective mulches to deter thrips"
        ],
        prevention: [
          "Plant resistant varieties (e.g., 'Plum Regal')",
          "Use virus-free transplants",
          "Install insect netting",
          "Control weeds that host thrips"
        ],
        severity: "High"
      },
      "Early_Blight": {
        description: "A fungal disease causing concentric rings on leaves, leading to defoliation and reduced yield.",
        symptoms: [
          "Dark spots with concentric rings",
          "Yellowing leaves",
          "Leaf drop starting from bottom"
        ],
        treatment: [
          "Apply copper-based fungicides",
          "Remove affected leaves",
          "Improve air circulation"
        ],
        prevention: [
          "Rotate crops (3-4 year cycle)",
          "Water at soil level (avoid wetting leaves)",
          "Stake plants for better airflow"
        ],
        severity: "Medium"
      },
      "Late_Blight": {
        description: "The infamous potato blight fungus that can destroy entire crops in humid conditions.",
        symptoms: [
          "Water-soaked lesions on leaves",
          "White fungal growth underside",
          "Rapid plant collapse"
        ],
        treatment: [
          "Apply chlorothalonil or mancozeb",
          "Remove and bag infected plants",
          "Avoid composting infected material"
        ],
        prevention: [
          "Choose resistant varieties",
          "Allow space between plants",
          "Avoid overhead watering"
        ],
        severity: "Critical"
      },
      "default": {
        description: "A plant disease affecting tomato leaves.",
        symptoms: ["Discoloration", "Spots or lesions", "Abnormal growth"],
        treatment: ["Remove affected leaves", "Apply appropriate treatment"],
        prevention: ["Practice crop rotation", "Maintain plant health"],
        severity: "Unknown"
      }
    };

    return diseaseDatabase[diseaseClass] || diseaseDatabase.default;
  };

  const formatResults = (data) => {
    if (!data?.outputs?.[0]?.predictions?.predictions?.length) {
      return (
        <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-700 font-medium">No diseases detected - your plant appears healthy!</p>
          </div>
        </div>
      );
    }

    const predictions = data.outputs[0].predictions.predictions;
    const primaryDisease = predictions[0].class;
    const diseaseInfo = getDiseaseInfo(primaryDisease);

    return (
      <div className="space-y-6">
        {/* Disease Overview Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Detection Summary</h3>
                <p className="text-sm text-gray-500">{predictions.length} affected area{predictions.length !== 1 ? 's' : ''} found</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                diseaseInfo.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                diseaseInfo.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                diseaseInfo.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                Severity: {diseaseInfo.severity}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {predictions.slice(0, 3).map((pred, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium capitalize text-sm">
                      {pred.class.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {(pred.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    <p>Size: {pred.width.toFixed(0)}×{pred.height.toFixed(0)}px</p>
                    <p>Position: ({pred.x.toFixed(0)}, {pred.y.toFixed(0)})</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Disease Information */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 lg:col-span-2">
            <div className="p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Disease Information</h3>
              
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">About {primaryDisease.replace(/_/g, ' ')}</h4>
                <p className="text-sm text-gray-600">{diseaseInfo.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Common Symptoms</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    {diseaseInfo.symptoms.map((symptom, i) => (
                      <li key={i} className="flex items-start">
                        <svg className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {symptom}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Recommended Treatment</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    {diseaseInfo.treatment.map((treatment, i) => (
                      <li key={i} className="flex items-start">
                        <svg className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {treatment}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Prevention Tips */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Prevention Tips</h3>
              <ul className="space-y-3">
                {diseaseInfo.prevention.map((tip, i) => (
                  <li key={i} className="flex items-start">
                    <span className="flex-shrink-0 bg-blue-100 text-blue-800 text-xs font-medium mr-3 px-2.5 py-0.5 rounded-full">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-600">{tip}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Visual Analysis */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Visual Analysis</h3>
            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ paddingBottom: '60%' }}>
              {imagePreview && (
                <img 
                  src={imagePreview} 
                  alt="Analysis" 
                  className="absolute inset-0 w-full h-full object-contain"
                />
              )}
              {predictions.map((pred, index) => {
                const color = index % 3 === 0 ? 'red' : index % 3 === 1 ? 'blue' : 'green';
                return (
                  <div
                    key={index}
                    className={`absolute border-2 border-${color}-500 bg-${color}-500 bg-opacity-20`}
                    style={{
                      left: `${pred.x - pred.width/2}px`,
                      top: `${pred.y - pred.height/2}px`,
                      width: `${pred.width}px`,
                      height: `${pred.height}px`,
                    }}
                  >
                    <div className={`absolute -top-5 left-0 bg-${color}-500 text-white text-xs px-2 py-0.5 rounded`}>
                      {pred.class.replace(/_/g, ' ')} ({(pred.confidence * 100).toFixed(0)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            <span className="text-green-600">Tomato Leaf</span> Disease Detector
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload a photo of your tomato leaves to detect diseases and get treatment recommendations
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          {/* Upload Section */}
          <div className="p-6 sm:p-8 border-b border-gray-200">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Leaf Image
                </label>
                <div className="mt-1 flex justify-center px-6 pt-10 pb-12 border-2 border-gray-300 border-dashed rounded-xl hover:border-green-500 transition-colors">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="mt-4 flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input 
                          id="file-upload" 
                          name="file-upload" 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageChange}
                          className="sr-only" 
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                </div>
                {file && (
                  <p className="mt-2 text-sm text-gray-500 text-center">
                    Selected: <span className="font-medium">{file.name}</span>
                  </p>
                )}
              </div>

              {imagePreview && (
                <div className="flex justify-center">
                  <div className="relative w-full max-w-md">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="rounded-lg shadow-sm border border-gray-200 w-full"
                    />
                    <button 
                      onClick={() => {
                        setFile(null);
                        setImagePreview(null);
                        setResult(null);
                      }}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition"
                      aria-label="Remove image"
                    >
                      <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Section */}
          <div className="p-6 sm:p-8 bg-gray-50">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Ready to analyze</h3>
                <p className="text-sm text-gray-500">
                  {file ? "Click detect to analyze your image" : "Please upload an image first"}
                </p>
              </div>
              <button
                onClick={handleDetect}
                disabled={loading || !file}
                className={`w-full sm:w-auto px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors ${
                  loading || !file ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  'Detect Disease'
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-1 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          {(result || loading) && (
            <div className="p-6 sm:p-8 border-t border-gray-200 bg-white">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Detection Results</h2>
              {loading ? (
                <div className="space-y-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
                      ))}
                    </div>
                  </div>
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-32 bg-gray-100 rounded-lg"></div>
                  </div>
                </div>
              ) : (
                formatResults(result)
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-sm text-gray-500">
          <p>For accurate results, upload clear photos of tomato leaves against a neutral background.</p>
          <p className="mt-1">This tool uses AI and may not be 100% accurate. Consult an expert for serious cases.</p>
        </div>
      </div>
    </div>
  );
}