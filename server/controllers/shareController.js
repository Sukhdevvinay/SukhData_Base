const Permission = require('../models/Permission');
const User = require('../models/User');
const Folder = require('../models/Folder');
const File = require('../models/File');
const crypto = require('crypto');
const fs = require('fs');

// @desc    Share a resource (File/Folder)
// @route   POST /api/share
// @access  Private
const shareResource = async (req, res) => {
    // ... existing implementation ...
    const { resourceId, resourceType, email, role, isPublic } = req.body;

    // Verify ownership
    // Verify existence first
    let resource;
    if (resourceType === 'Folder') {
        resource = await Folder.findById(resourceId);
    } else {
        resource = await File.findById(resourceId);
    }

    if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
    }

    // Verify ownership
    // Note: Use == for loose equality (ObjectId vs string) or .toString()
    if (resource.ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only share resources you own' });
    }

    try {
        let permissionData = {
            resourceId,
            resourceType,
            role: role || 'viewer',
            createdBy: req.user._id,
            isPublic: !!isPublic
        };

        if (isPublic) {
            // Generate token
            permissionData.token = crypto.randomBytes(16).toString('hex');
        } else if (email) {
            // Find user by email
            const userToShare = await User.findOne({ email });
            if (!userToShare) {
                return res.status(404).json({ message: 'User not found' });
            }
            permissionData.userId = userToShare._id;
        } else {
            return res.status(400).json({ message: 'Provide email or set isPublic to true' });
        }

        const permission = await Permission.create(permissionData);
        res.status(201).json(permission);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get permissions
// @route   GET /api/share/:resourceId
const getPermissions = async (req, res) => {
    try {
        const permissions = await Permission.find({ resourceId: req.params.resourceId }).populate('userId', 'name email');
        res.json(permissions);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Access Shared Resource via Token
// @route   GET /api/share/public/:token
// @access  Public
const accessPublicResource = async (req, res) => {
    const { token } = req.params;
    try {
        const permission = await Permission.findOne({ token, isPublic: true });
        if (!permission) return res.status(404).json({ message: 'Link invalid or expired' });

        if (permission.expiresAt && new Date() > permission.expiresAt) {
            return res.status(410).json({ message: 'Link expired' });
        }

        let resource;
        if (permission.resourceType === 'Folder') {
            resource = await Folder.findById(permission.resourceId);
        } else {
            resource = await File.findById(permission.resourceId);
        }

        res.json({ resource, permission });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Download Shared File
// @route   GET /api/share/public/:token/download
// @access  Public
const downloadPublicFile = async (req, res) => {
    const { token } = req.params;
    try {
        const permission = await Permission.findOne({ token, isPublic: true });
        if (!permission) return res.status(404).json({ message: 'Link invalid or expired' });

        if (permission.resourceType !== 'File') {
            return res.status(400).json({ message: 'Resource is not a file' });
        }

        const file = await File.findById(permission.resourceId);
        if (!file) return res.status(404).json({ message: 'File not found' });

        if (!fs.existsSync(file.storagePath)) {
            return res.status(404).json({ message: 'File not found on disk' });
        }

        res.download(file.storagePath, file.name);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = {
    shareResource,
    getPermissions,
    accessPublicResource,
    downloadPublicFile
};
