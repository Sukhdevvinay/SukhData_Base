const File = require('../models/File');
const User = require('../models/User');
const UploadSession = require('../models/UploadSession');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Ensure directories exist
const chunksDir = path.join(__dirname, '../chunks');
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(chunksDir)) fs.mkdirSync(chunksDir);
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// @desc    Initialize Upload Session
// @route   POST /api/files/upload-session
// @access  Private
const initUploadSession = async (req, res) => {
    const { fileName, fileSize, parentId } = req.body;

    // Check Quota
    if (req.user.storageUsed + fileSize > req.user.storageLimit) {
        return res.status(400).json({ message: 'Storage quota exceeded' });
    }

    try {
        const uploadId = uuidv4();
        const chunkSize = 5 * 1024 * 1024; // 5MB
        const totalChunks = Math.ceil(fileSize / chunkSize);

        const session = await UploadSession.create({
            userId: req.user._id,
            fileName,
            fileSize,
            parentId: parentId || null,
            uploadId,
            totalChunks
        });

        res.status(201).json({ sessionId: session._id, uploadId, chunkSize });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Upload Chunk
// @route   POST /api/files/upload-chunk
// @access  Private
const uploadChunk = async (req, res) => {
    // Headers: x-upload-id, x-chunk-index
    const uploadId = req.headers['x-upload-id'];
    const chunkIndex = parseInt(req.headers['x-chunk-index']);

    if (!uploadId || isNaN(chunkIndex)) {
        return res.status(400).json({ message: 'Missing upload headers' });
    }

    try {
        const session = await UploadSession.findOne({ uploadId, userId: req.user._id });
        if (!session) {
            return res.status(404).json({ message: 'Upload session not found' });
        }

        const chunkPath = path.join(chunksDir, `${uploadId}-${chunkIndex}`);
        const writeStream = fs.createWriteStream(chunkPath);

        req.pipe(writeStream);

        writeStream.on('finish', async () => {
            if (!session.uploadedChunks.includes(chunkIndex)) {
                session.uploadedChunks.push(chunkIndex);
                await session.save();
            }
            res.status(200).json({ message: 'Chunk uploaded' });
        });

        writeStream.on('error', (err) => {
            console.error(err);
            res.status(500).json({ message: 'Chunk upload failed' });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Complete Upload (Merge)
// @route   POST /api/files/complete-upload
// @access  Private
const completeUpload = async (req, res) => {
    const { uploadId } = req.body;

    try {
        const session = await UploadSession.findOne({ uploadId, userId: req.user._id });
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if (session.uploadedChunks.length !== session.totalChunks) {
            return res.status(400).json({ message: `Incomplete upload. ${session.uploadedChunks.length}/${session.totalChunks} chunks.` });
        }

        const finalPath = path.join(uploadsDir, `${uploadId}-${session.fileName}`);
        const writeStream = fs.createWriteStream(finalPath);

        // Sort indices
        session.uploadedChunks.sort((a, b) => a - b);

        for (const index of session.uploadedChunks) {
            const chunkPath = path.join(chunksDir, `${uploadId}-${index}`);
            if (fs.existsSync(chunkPath)) {
                const data = fs.readFileSync(chunkPath);
                writeStream.write(data);
                fs.unlinkSync(chunkPath); // Cleanup chunk
            }
        }

        writeStream.end();

        writeStream.on('finish', async () => {
            const file = await File.create({
                name: session.fileName,
                parentId: session.parentId,
                ownerId: req.user._id,
                size: session.fileSize,
                mimeType: 'application/octet-stream',
                storagePath: finalPath,
            });

            await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: session.fileSize } });
            await UploadSession.findByIdAndDelete(session._id);

            res.status(201).json(file);
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during merge' });
    }
};

// @desc    Delete File (Soft)
// @route   DELETE /api/files/:id
// @access  Private
const deleteFile = async (req, res) => {
    try {
        const file = await File.findOne({ _id: req.params.id, ownerId: req.user._id });
        if (!file) return res.status(404).json({ message: 'File not found' });

        file.isDeleted = true;
        file.deletedAt = new Date();
        await file.save();

        res.json({ message: 'File moved to trash' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}

const downloadFile = async (req, res) => {
    try {
        const file = await File.findOne({ _id: req.params.id });

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Check permissions (Owner OR Shared)
        if (file.ownerId.toString() !== req.user._id.toString()) {
            const Permission = require('../models/Permission');
            const shared = await Permission.findOne({
                resourceId: file._id,
                userId: req.user._id
            });

            // Also allow if it's a public link (handled by separate route usually, but for authenticated access check for shared record)
            if (!shared) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        if (file.isDeleted) {
            return res.status(404).json({ message: 'File is in trash' });
        }

        if (!fs.existsSync(file.storagePath)) {
            return res.status(404).json({ message: 'File not found on server' });
        }

        res.download(file.storagePath, file.name);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    initUploadSession,
    uploadChunk,
    completeUpload,
    deleteFile,
    downloadFile
};
