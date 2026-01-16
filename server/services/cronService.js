const cron = require('node-cron');
const Folder = require('../models/Folder');
const File = require('../models/File');
const UploadSession = require('../models/UploadSession');
const fs = require('fs');
const path = require('path');

const startCronJobs = () => {
    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('Running Cron Job: Cleanup Trash & Expired Sessions');

        try {
            // 1. Cleanup Expired Upload Sessions (> 24 hours)
            const expiredSessions = await UploadSession.find({
                expiresAt: { $lt: new Date() }
            });

            for (const session of expiredSessions) {
                // Delete temporary chunks
                const chunksDir = path.join(__dirname, '../chunks');
                // Pattern: uploadId-index
                // We don't verify index strictly here, just look for files starting with uploadId
                const files = fs.readdirSync(chunksDir);
                for (const file of files) {
                    if (file.startsWith(session.uploadId)) {
                        fs.unlinkSync(path.join(chunksDir, file));
                    }
                }
                await UploadSession.findByIdAndDelete(session._id);
            }
            console.log(`Cleaned ${expiredSessions.length} expired sessions.`);

            // 2. Cleanup Old Trash (> 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const oldFiles = await File.find({
                isDeleted: true,
                deletedAt: { $lt: thirtyDaysAgo }
            });

            const oldFolders = await Folder.find({
                isDeleted: true,
                deletedAt: { $lt: thirtyDaysAgo }
            });

            // Delete Files
            for (const file of oldFiles) {
                if (fs.existsSync(file.storagePath)) {
                    fs.unlinkSync(file.storagePath);
                }
                await File.findByIdAndDelete(file._id);
            }

            // Delete Folders
            // (Note: This simple logic deletes folders but might leave orphaned children if structure is complex.
            // Ideally we rely on the recursive delete logic or simply delete everything marked deleted > 30 days.
            // Since our Soft Delete logic marked children recursively, they should also be caught here eventually.)
            for (const folder of oldFolders) {
                await Folder.findByIdAndDelete(folder._id);
            }

            console.log(`Cleaned ${oldFiles.length} files and ${oldFolders.length} folders from trash.`);

        } catch (error) {
            console.error('Cron Job Failed:', error);
        }
    });
};

module.exports = startCronJobs;
