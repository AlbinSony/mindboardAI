import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import {ArrowLeftIcon, MicIcon, MicOffIcon, StopCircleIcon} from "lucide-react"
import toast from 'react-hot-toast';
import api from '../lib/axios.';

const CreatePage = () => {
  const [title,setTitle] = useState("");
  const [content,setContent] = useState("");
  const [loading,setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioProcessing, setAudioProcessing] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const navigate = useNavigate();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        await processAudio(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      toast.success("Recording started...");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Could not start recording. Please check microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioProcessing(true);
      toast.info("Processing audio...");
    }
  };

  const processAudio = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await api.post('/notes/process-audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for audio processing
      });

      const { title: generatedTitle, content: generatedContent } = response.data;
      
      if (generatedTitle) {
        setTitle(generatedTitle);
      }
      if (generatedContent) {
        setContent(generatedContent);
      }
      
      toast.success("Audio processed successfully!");
    } catch (error) {
      console.error("Error processing audio:", error);
      
      let errorMessage = "Failed to process audio. Please try again.";
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = "Audio processing timed out. Please try with a shorter recording.";
      } else if (error.response) {
        const { status, data } = error.response;
        if (status === 413) {
          errorMessage = "Audio file too large. Please record a shorter clip.";
        } else if (status === 429) {
          errorMessage = "Too many requests. Please wait a moment before trying again.";
        } else if (data && data.message) {
          errorMessage = data.message;
        }
      } else if (error.request) {
        errorMessage = "Cannot connect to server. Please check your connection.";
      }
      
      toast.error(errorMessage);
    } finally {
      setAudioProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!title.trim() || !content.trim() ) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await api.post("/notes",{
        title,
        content
      })
      toast.success("Note created successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to create note. Please try again.");
      console.error("Error creating note:", error);
    }
    finally{
      setLoading(false);
    }
  }
  return (
    <div className='min-h-screen bg-base-200'>
      <div className='max-w-7xl mx-auto p-4 mt-6'>
        <div className='max-w-2xl mx-auto'>
          <Link to={"/"} className='btn btn-ghost mb-6'>
          <ArrowLeftIcon className='size-5' />
          Back To Notes
          </Link>
          <div className='card bg-base-100'>
            <div className='card-body'>
              <h2 className='card-title text-2xl mb-4'>Create New Note</h2>
              <form onSubmit={handleSubmit}>
                <div className='form-control mb-4'>
                  <label className='label'>
                    <span className='label-text'>Title</span>
                  </label>
                  <input type="text" placeholder='Note Title' className='input input-bordered' value={title}  onChange={ (e) => setTitle(e.target.value)}/>
                </div>
                <div className='form-control mb-4'>
                  <label className='label'>
                    <span className='label-text'>Content</span>
                  </label>
                  <textarea placeholder='Write Your Note Here...' className='textarea textarea-bordered h-32' value={content} onChange={(e)=>setContent(e.target.value)}></textarea>
                </div>
                
                {/* Audio Recording Section */}
                <div className='form-control mb-4'>
                  <label className='label'>
                    <span className='label-text'>Voice Recording</span>
                  </label>
                  <div className='flex gap-2 items-center flex-wrap'>
                    {!isRecording ? (
                      <button 
                        type='button' 
                        className='btn btn-secondary btn-sm'
                        onClick={startRecording}
                        disabled={audioProcessing}
                      >
                        <MicIcon className='size-4' />
                        Start Recording
                      </button>
                    ) : (
                      <button 
                        type='button' 
                        className='btn btn-error btn-sm'
                        onClick={stopRecording}
                      >
                        <StopCircleIcon className='size-4' />
                        Stop Recording
                      </button>
                    )}
                    
                    {audioProcessing && (
                      <div className='flex items-center gap-2'>
                        <span className="loading loading-spinner loading-sm"></span>
                        <span className='text-sm text-primary'>
                          Processing audio with AI...
                        </span>
                      </div>
                    )}
                    
                    {isRecording && (
                      <div className='flex items-center gap-2'>
                        <div className='w-3 h-3 bg-red-500 rounded-full animate-pulse'></div>
                        <span className='text-sm text-red-500 font-medium'>Recording...</span>
                      </div>
                    )}
                  </div>
                  <div className='text-xs text-base-content/60 mt-2'>
                    💡 <strong>Tip:</strong> Speak clearly and avoid background noise for best results. The AI will transcribe and organize your speech into a structured note.
                  </div>
                </div>

                <div className="card-actions justify-end">
                  <button type='submit' className='btn btn-primary' disabled={loading || isRecording || audioProcessing} >
                    {loading ? "Creating..." : "Create Note"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePage