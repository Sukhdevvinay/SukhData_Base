const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null,
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    path: {
        type: String, // e.g., ",rootId,subId," - Materialized Path for efficient querying
        default: '',
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

// Index for efficient querying of children
folderSchema.index({ parentId: 1, ownerId: 1 });
// Index for traversing the tree
folderSchema.index({ path: 1 });

module.exports = mongoose.model('Folder', folderSchema);
