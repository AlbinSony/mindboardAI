import Note from "../models/Note.js";

export async function getAllNotes(req, res) {
  try {
    const notes = await Note.find().sort({createdAt:-1});
    res.status(200).json(notes);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getNoteById(req,res){
    try {
        const id = req.params.id;
        const note = await Note.findById(id);
        res.status(200).json(note);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
        console.log(error);
    }
}

export async function createNote(req, res) {
  try {
    const { title, content } = req.body;
    const newNote = new Note({ title, content });
    await newNote.save();
    res.status(201).json(newNote);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateNote(req, res) {
  try {
    const { title, content } = req.body;
    const updatedNote=await Note.findByIdAndUpdate(req.params.id, { title, content },{new:true});
    if(!updateNote) return res.status(404).json({message:"Note Not Found"})
    res.status(200).json({ message: "Note Updated succesfully" },updatedNote);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function deleteNote(req, res) {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.status(200).json({message:"Node Deleted Succesfully"})
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" }); 
  }
}
