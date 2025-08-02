import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import RateLimitedUI from "../components/RateLimitedUI";

const HomePage = () => {
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [notes,setNotes]= useState([])
  const [loading, setLoading] = useState(true);

  useEffect(()=> {},[])

  return (
    <div className="min-h-screen">
      <Navbar />
      {isRateLimited && <RateLimitedUI/>}
    </div>
  );
};

export default HomePage;
