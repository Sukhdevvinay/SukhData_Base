const mongoose = require('mongoose');

const uploadSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fileName: {
        type: String,
        required: true,
    },
    fileSize: {
        type: Number,
        required: true,
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null,
    },
    uploadId: {
        type: String,
        required: true,
        unique: true, // Unique Session ID
    },
    uploadedChunks: {
        type: [Number], // Indices of chunks successfully uploaded
        default: [],
    },
    totalChunks: {
        type: Number,
        required: true,
    },
    expiresAt: {
        type: Date,
        default: () => new Date(+new Date() + 24 * 60 * 60 * 1000), // 24 hours
    },
}, { timestamps: true });

module.exports = mongoose.model('UploadSession', uploadSessionSchema);
