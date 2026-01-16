const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null, // null means root folder
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    size: {
        type: Number,
        required: true,
    },
    mimeType: {
        type: String,
        required: true,
    },
    storagePath: {
        type: String, // Path on disk or Object Store key
        required: true,
    },
    uniqueIdentifier: {
        type: String, // Could be hash or UUID to handle duplicates/versions
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

fileSchema.index({ parentId: 1, ownerId: 1 });
fileSchema.index({ ownerId: 1, isDeleted: 1 });

module.exports = mongoose.model('File', fileSchema);
