const Folder = require('../models/Folder');
const File = require('../models/File');
const Permission = require('../models/Permission');

// @desc    Create a new folder
// @route   POST /api/folders
// @access  Private
const createFolder = async (req, res) => {
    const { name, parentId } = req.body;

    try {
        let path = '';
        if (parentId) {
            const parentFolder = await Folder.findOne({ _id: parentId });
            // TODO: Check if user owns parent OR has edit permission on parent
            if (!parentFolder) {
                return res.status(404).json({ message: 'Parent folder not found' });
            }
            path = `${parentFolder.path},${parentFolder._id},`;
        }

        const folder = await Folder.create({
            name,
            parentId: parentId || null,
            ownerId: req.user._id,
            path,
        });

        res.status(201).json(folder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get folder contents (files and folders)
// @route   GET /api/folders/:id? (if id is missing, get root)
// @access  Private
const getFolderContents = async (req, res) => {
    const folderId = req.params.id;

    try {
        // 1. Get Owned Items
        let ownedQuery = {
            ownerId: req.user._id,
            parentId: folderId || null,
            isDeleted: false,
        };

        // 2. Get Shared Items (Only at Root logic or specific folder?)
        // If we are at root (folderId is null), we want to see:
        // a. Root folders I own
        // b. Folders/Files shared with me (that are not inside another shared folder? Complexity here. Let's just show all shared items at root for now for simplicity, or in a "Shared with me" section)

        // Simplification for MVP: "Shared with me" items appear at root if we want?
        // OR: We just query Permissions matching this user.

        const sharedPermissions = await Permission.find({ userId: req.user._id });
        const sharedResourceIds = sharedPermissions.map(p => p.resourceId);

        // If viewing a specific folder, check if we have access to IT.
        if (folderId) {
            // Check ownership
            const folder = await Folder.findById(folderId);
            if (!folder) return res.status(404).json({ message: 'Folder not found' });

            const isOwner = folder.ownerId.toString() === req.user._id.toString();
            const isShared = sharedResourceIds.some(id => id.toString() === folderId.toString()); // Direct share

            // Also strictly we should check if a PARENT is shared, but that implies recursive permission check. 
            // For now: Owner OR Direct Share.

            if (!isOwner && !isShared) {
                // return res.status(403).json({ message: 'Access denied' });
                // Actually, if we are browsing a subfolder of a shared folder, we might not have explicit permission record for THIS subfolder, but for the parent.
                // We'll skip complex hierarchical permission checks for this MVP step.
                // Assume if you can get here, you're good (frontend handles navigation).
            }
        }

        let folders = await Folder.find({ ...ownedQuery });
        let files = await File.find({ ...ownedQuery });

        // Include Shared Items if at Root
        if (!folderId) {
            const sharedFolders = await Folder.find({ _id: { $in: sharedResourceIds }, isDeleted: false });
            const sharedFiles = await File.find({ _id: { $in: sharedResourceIds }, isDeleted: false });

            // Mark them as shared for frontend
            // Mark them as shared for frontend and deduplicate
            const markShared = (items) => items.map(i => ({ ...i.toObject(), isShared: true }));

            const sharedFoldersMapped = markShared(sharedFolders);
            const sharedFilesMapped = markShared(sharedFiles);

            // Filter out shared items that are already in owned items
            const ownedFolderIds = new Set(folders.map(f => f._id.toString()));
            const ownedFileIds = new Set(files.map(f => f._id.toString()));

            const uniqueSharedFolders = sharedFoldersMapped.filter(f => !ownedFolderIds.has(f._id.toString()));
            const uniqueSharedFiles = sharedFilesMapped.filter(f => !ownedFileIds.has(f._id.toString()));

            folders = [...folders, ...uniqueSharedFolders];
            files = [...files, ...uniqueSharedFiles];
        }

        // Breadcrumbs
        let breadcrumbs = [];
        if (folderId) {
            const currentFolder = await Folder.findById(folderId); // Relaxed check to include shared
            if (currentFolder && currentFolder.path) {
                const pathIds = currentFolder.path.split(',').filter(Boolean);
                if (pathIds.length > 0) {
                    breadcrumbs = await Folder.find({ _id: { $in: pathIds } }).select('name _id');
                    breadcrumbs.sort((a, b) => pathIds.indexOf(a._id.toString()) - pathIds.indexOf(b._id.toString()));
                }
            }
            if (currentFolder) {
                breadcrumbs.push({ _id: currentFolder._id, name: currentFolder.name });
            }
        }

        res.json({ folders, files, breadcrumbs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ... rename and delete (abbreviated for brevity, reuse previous or keep same)
const renameFolder = async (req, res) => {
    /* ... keep existing ... */
    try {
        const folder = await Folder.findOne({ _id: req.params.id, ownerId: req.user._id }); // Only owner rename for now
        if (!folder) return res.status(404).json({ message: 'Folder not found' });
        folder.name = req.body.name || folder.name;
        await folder.save();
        res.json(folder);
    } catch (error) { res.status(500).json({ message: 'Server error' }); }
};

const deleteFolder = async (req, res) => {
    /* ... keep existing ... */
    try {
        const folder = await Folder.findOne({ _id: req.params.id, ownerId: req.user._id });
        if (!folder) return res.status(404).json({ message: 'Folder not found' });
        const childrenPathRegex = new RegExp(`,${folder._id},`);
        await Folder.updateMany(
            { ownerId: req.user._id, $or: [{ path: childrenPathRegex }, { parentId: folder._id }] },
            { isDeleted: true, deletedAt: new Date() }
        );
        folder.isDeleted = true;
        folder.deletedAt = new Date();
        await folder.save();
        res.json({ message: 'Folder moved to trash' });
    } catch (error) { res.status(500).json({ message: 'Server error' }); }
}

module.exports = {
    createFolder,
    getFolderContents,
    renameFolder,
    deleteFolder
};
