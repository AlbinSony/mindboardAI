import {Ratelimit} from "@upstash/ratelimit";
import {Redis} from "@upstash/redis"

//ratelimiter that allows 10 requests per 20 seconds
const rateLimit = new Ratelimit({
    redis:Redis.fromEnv(),
    limiter:()
})