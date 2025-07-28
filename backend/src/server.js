import express from 'express'
import notesRoutes from './routes/notesRoutes.js'
const app = express()

app.use("/api/notes",notesRoutes)

app.listen(5002,()=> {
    console.log("Server Running on Port:5001");
})

