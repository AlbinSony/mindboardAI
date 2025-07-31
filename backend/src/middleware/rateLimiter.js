import rateLimit from "../config/upstash.js"

const ratelimiter = async (req,res,next) => {
    try {
        const {success} = await rateLimit.limit("my-limit-key")//in real case instead of "my-limit" user specific key should be used, like user id or ip address
        if(!success){
            return res.status(429).json({
                message: "Too many requests, please try again later."
            })
        }

        next()
    } catch (error) {
        console.log("Rate Limiter Error:", error);
        next(error); // Pass the error to the next middleware
        
    }
}

export default ratelimiter