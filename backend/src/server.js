import express from 'express'
import notesRoutes from './routes/notesRoutes.js'
import { connectDB } from './config/db.js'
import dotenv from "dotenv"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001

connectDB()

app.use(express.json())

// app.use((req,res,next)=> {
//     console.log("Request Method",req.method + " Request URL: " + req.url);
//     next();
// })

app.use("/api/notes",notesRoutes)
app.listen(PORT,()=> {
    console.log("Server Running on Port:",PORT);
})