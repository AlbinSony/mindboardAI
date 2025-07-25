export function getAllNotes (req,res) {
    res.send("You Just Fetched Notes")
};

export function createNote (req,res) {
    res.status(201).json({message:"Note Created succesfully"});
};

export function updateNote (req,res) {
    res.status(200).json({message:"Note Updated succesfully"});
}

export function deleteNote (req,res) {
    res.status(200).json({message:"Note Deleted succesfully"});
}
