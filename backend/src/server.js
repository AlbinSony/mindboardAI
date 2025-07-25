import express from 'express'
import notesRoutes from './routes/notesRoutes.js'
const app = express()

app.use("/api/notes",notesRoutes)

app.listen(5002,()=> {
    console.log("Server Running on Port:5001");
})

"mongodb+srv://albin:albin@cluster0.s8zt5sm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"