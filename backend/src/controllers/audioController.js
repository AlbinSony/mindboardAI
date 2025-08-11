import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Validate environment variables
if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
  console.error('Please check your .env file in the backend directory');
  // Don't exit here, let the server start but log the error
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy-key');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const fileExtension = path.extname(file.originalname) || '.webm';
    cb(null, 'audio-' + Date.now() + fileExtension);
  }
});

export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit (increased for better audio quality)
  },
  fileFilter: function (req, file, cb) {
    // Accept common audio formats
    const allowedMimeTypes = [
      'audio/webm',
      'audio/wav', 
      'audio/mp3',
      'audio/mpeg',
      'audio/mp4',
      'audio/ogg',
      'audio/flac'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  }
});

export async function processAudio(req, res) {
  let audioFilePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No audio file provided" });
    }

    audioFilePath = req.file.path;
    console.log(`Processing audio file: ${audioFilePath}`);
    console.log(`File size: ${req.file.size} bytes`);
    console.log(`File mimetype: ${req.file.mimetype}`);
    
    // Check if file exists and has content
    if (!fs.existsSync(audioFilePath)) {
      throw new Error("Audio file not found after upload");
    }
    
    const stats = fs.statSync(audioFilePath);
    if (stats.size === 0) {
      throw new Error("Audio file is empty");
    }
    
    // Read the audio file
    const audioBuffer = fs.readFileSync(audioFilePath);
    
    // Convert to base64 for Gemini API
    const audioBase64 = audioBuffer.toString('base64');
    
    // Initialize Gemini model that supports audio
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.4,
        topP: 0.8,
        maxOutputTokens: 2048,
      }
    });
    
    // Create the prompt for audio processing
    const prompt = `
    Please transcribe the following audio recording exactly as spoken. Do not add any analysis, interpretation, or additional information.
    
    Instructions:
    1. Extract only the actual words spoken by the user
    2. Create a short title from the main topic mentioned
    3. Put the exact transcribed content in the content field
    4. Do not add commentary, analysis, or explanations about the audio quality
    
    Return your response in this exact JSON format (no additional text or markdown):
    {
      "title": "Short title based on what was said (max 60 characters)",
      "content": "Exact transcription of what the user said, nothing more"
    }
    
    Rules:
    - Only transcribe the actual spoken words
    - Do not add phrases like "The audio recording consisted of" or "Following the statement"
    - Do not analyze audio quality or add interpretations
    - Keep the content as the raw transcribed speech
    - If unclear, just write what you can understand, don't explain why it's unclear
    `;

    console.log("Sending request to Gemini API...");

    // Process with Gemini - Using the correct format for audio
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: req.file.mimetype,
          data: audioBase64
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    console.log("Raw Gemini response:", text);
    
    // Try to parse JSON response
    let parsedResponse;
    try {
      // Clean the response text to extract JSON
      let cleanText = text.trim();
      
      // Remove markdown code blocks if present
      cleanText = cleanText.replace(/```json\s*|\s*```/g, '');
      cleanText = cleanText.replace(/```\s*|\s*```/g, '');
      
      // Try to find JSON object in the response
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }
      
      parsedResponse = JSON.parse(cleanText);
      
      // Validate the parsed response
      if (typeof parsedResponse.title !== 'string' || typeof parsedResponse.content !== 'string') {
        throw new Error('Invalid response format from AI');
      }
      
    } catch (parseError) {
      console.log("JSON parsing failed:", parseError);
      console.log("Raw text:", text);
      
      // Fallback: extract title and content manually
      const lines = text.split('\n').filter(line => line.trim());
      let title = "Voice Note";
      let content = text;
      
      // Try to extract a title from the first meaningful line
      if (lines.length > 0) {
        const firstLine = lines[0].replace(/[^\w\s]/g, '').trim();
        if (firstLine.length > 0 && firstLine.length < 100) {
          title = firstLine.substring(0, 80);
        }
      }
      
      // Clean up the content
      content = text.replace(/```json|```/g, '').trim();
      if (!content || content.length < 10) {
        content = "The audio was processed but the content could not be clearly transcribed. Please try recording again with clearer audio.";
      }
      
      parsedResponse = { title, content };
    }

    // Ensure title and content are not empty
    if (!parsedResponse.title || parsedResponse.title.trim().length === 0) {
      parsedResponse.title = "Voice Note " + new Date().toLocaleDateString();
    }
    
    if (!parsedResponse.content || parsedResponse.content.trim().length === 0) {
      parsedResponse.content = "The audio was processed but no meaningful content could be extracted. Please try recording again.";
    }

    // Clean up: delete the uploaded file
    fs.unlink(audioFilePath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });

    console.log("Successfully processed audio. Title:", parsedResponse.title.substring(0, 50) + "...");

    res.status(200).json({
      title: parsedResponse.title.substring(0, 100).trim(), // Limit title length
      content: parsedResponse.content.trim(),
      message: "Audio processed successfully"
    });

  } catch (error) {
    console.error("Error processing audio:", error);
    
    // Clean up file if it exists
    if (audioFilePath && fs.existsSync(audioFilePath)) {
      fs.unlink(audioFilePath, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }
    
    // Provide more specific error messages
    let errorMessage = "Failed to process audio";
    if (error.message.includes('API_KEY')) {
      errorMessage = "AI service configuration error";
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      errorMessage = "AI service temporarily unavailable due to quota limits";
    } else if (error.message.includes('audio')) {
      errorMessage = "Audio file could not be processed";
    }
    
    res.status(500).json({ 
      message: errorMessage,
      title: "Audio Processing Failed",
      content: "The audio could not be processed at this time. Please try again with a shorter, clearer recording.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
