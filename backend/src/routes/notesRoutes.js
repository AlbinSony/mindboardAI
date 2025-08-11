import express from "express";
import { getAllNotes } from "../controllers/notesController.js";
import { getNoteById } from "../controllers/notesController.js";
import { createNote } from "../controllers/notesController.js";
import { updateNote } from "../controllers/notesController.js";
import { deleteNote } from "../controllers/notesController.js";
import { processAudio, upload } from "../controllers/audioController.js";

const router = express.Router();

router.get("/",getAllNotes)
router.get("/:id",getNoteById)
router.post("/",createNote)
router.put("/:id",updateNote)
router.delete("/:id",deleteNote)
router.post("/process-audio", upload.single('audio'), processAudio)

export default router;
