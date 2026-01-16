const express = require('express');
const router = express.Router();
const {
    createFolder,
    getFolderContents,
    renameFolder,
    deleteFolder
} = require('../controllers/folderController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createFolder)
    .get(protect, (req, res) => getFolderContents(req, res)); // Root folder

router.route('/:id')
    .get(protect, getFolderContents) // Specific folder
    .put(protect, renameFolder)
    .delete(protect, deleteFolder);

module.exports = router;
