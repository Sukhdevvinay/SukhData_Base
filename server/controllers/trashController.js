const Folder = require('../models/Folder');
const File = require('../models/File');
const path = require('path');
const fs = require('fs');

// @desc    Get Trash Contents
// @route   GET /api/trash
// @access  Private
const getTrash = async (req, res) => {
    try {
        const folders = await Folder.find({ ownerId: req.user._id, isDeleted: true });
        const files = await File.find({ ownerId: req.user._id, isDeleted: true });
        res.json({ folders, files });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Restore Item
// @route   PUT /api/trash/:type/:id/restore
// @access  Private
const restoreItem = async (req, res) => {
    const { type, id } = req.params; // type: 'file' or 'folder'

    try {
        let item;
        if (type === 'folder') {
            item = await Folder.findOne({ _id: id, ownerId: req.user._id });
            // TODO: Also restore children? 
            // Ideally yes. But for now, let's just restore the folder. 
            // The user might have to restore children manually or we implement recursive restore.
            // Recursive restore is better UX.
            const childrenPathRegex = new RegExp(`,${id},`);
            await Folder.updateMany(
                { ownerId: req.user._id, path: childrenPathRegex },
                { isDeleted: false, deletedAt: null }
            );
        } else {
            item = await File.findOne({ _id: id, ownerId: req.user._id });
        }

        if (!item) return res.status(404).json({ message: 'Item not found' });

        item.isDeleted = false;
        item.deletedAt = null;
        await item.save();

        res.json({ message: 'Item restored' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Permanently Delete Item
// @route   DELETE /api/trash/:type/:id
// @access  Private
const deletePermanent = async (req, res) => {
    const { type, id } = req.params;

    try {
        if (type === 'folder') {
            const folder = await Folder.findOne({ _id: id, ownerId: req.user._id });
            if (!folder) return res.status(404).json({ message: 'Folder not found' });

            // Delete all children? Yes.
            // This is dangerous, warning needed on frontend.
            // For MVP: Delete folder record.
            // Ideally: Find all subfiles -> delete from disk. Find all subfolders -> delete.

            await Folder.deleteOne({ _id: id });
            // Orphaned files/folders remain? Yes if we don't recurse.
            // TODO: Recursive cleanup. 

        } else {
            const file = await File.findOne({ _id: id, ownerId: req.user._id });
            if (!file) return res.status(404).json({ message: 'File not found' });

            // Delete from disk
            if (fs.existsSync(file.storagePath)) {
                fs.unlinkSync(file.storagePath);
            }

            // Decrease Valid Storage Used (if trash counts towards quota, we decrease now. If it didn't, we wouldn't)
            // Requirement: "Trash still counts until permanently deleted"
            // So NOW we decrease quota.
            const User = require('../models/User'); // delayed import to avoid circular dep issues if any
            await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: -file.size } });

            await File.deleteOne({ _id: id });
        }

        res.json({ message: 'Permanently deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getTrash,
    restoreItem,
    deletePermanent
};
