import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import RateLimitedUI from "../components/RateLimitedUI";
import axios from "axios";
import toast from "react-hot-toast";

const HomePage = () => {
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [notes,setNotes]= useState([])
  const [loading, setLoading] = useState(true);

  useEffect(()=> {
    const fetchNotes = async()=> {
      try {
        const res = await axios.get("http://localhost:5001/api/notes")
        console.log(res.data);
        setNotes(res.data)
        setIsRateLimited(false)
      } catch (error) {
        console.error("Error fetching notes:", error);
        if(error.response && error.response.status === 429) {
          setIsRateLimited(true);
        }
        else{
          toast.error("Failed to fetch notes. Please try again later.");
        }
      }
      finally{
        setLoading(false)
      }
    }
    fetchNotes();
  },[])

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4 mt-6">
        {loading && <div className="text-center text-primary py-10">Loading Notes...</div>}
      </div>
      {isRateLimited && <RateLimitedUI/>}
    </div>
  );
};

export default HomePage;
