const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'resourceType'
    },
    resourceType: {
        type: String,
        required: true,
        enum: ['File', 'Folder']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // Null if it's a public link
    },
    role: {
        type: String,
        required: true,
        enum: ['viewer', 'editor'],
        default: 'viewer'
    },
    token: {
        type: String, // For public sharing links
        default: null
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

permissionSchema.index({ resourceId: 1, userId: 1 });
permissionSchema.index({ token: 1 });

module.exports = mongoose.model('Permission', permissionSchema);
