import {Ratelimit} from "@upstash/ratelimit";
import {Redis} from "@upstash/redis"
import dotenv from "dotenv"

dotenv.config()

//ratelimiter that allows 100 requests per 60 seconds
const rateLimit = new Ratelimit({
    redis:Redis.fromEnv(),
    limiter:Ratelimit.slidingWindow(100,"60 s")
})

export default rateLimit