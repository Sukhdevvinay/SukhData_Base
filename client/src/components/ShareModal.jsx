import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FaCopy } from 'react-icons/fa';

const ShareModal = ({ resourceId, resourceType, onClose }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('viewer');
    const [generatedLink, setGeneratedLink] = useState(null);

    const handleShare = async (e) => {
        e.preventDefault();
        try {
            await api.post('/share', { resourceId, resourceType, email, role });
            toast.success('Shared successfully');
            setEmail('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to share');
        }
    };

    const generatePublicLink = async () => {
        try {
            const { data } = await api.post('/share', { resourceId, resourceType, isPublic: true, role: 'viewer' });
            // Link format: currentHost/share/public/token
            const link = `${window.location.origin}/share/public/${data.token}`;
            setGeneratedLink(link);
            toast.success('Public link generated');
        } catch (error) {
            toast.error('Failed to generate link');
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        toast.success('Copied to clipboard');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded max-w-md w-full p-6">
                <h3 className="text-lg font-bold mb-4">Share {resourceType}</h3>

                <form onSubmit={handleShare} className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invite by Email</label>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="flex-1 border p-2 rounded"
                            required
                        />
                        <select value={role} onChange={(e) => setRole(e.target.value)} className="border p-2 rounded">
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                        </select>
                    </div>
                    <button type="submit" className="mt-2 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Send Invite</button>
                </form>

                <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Public Link</h4>
                    {!generatedLink ? (
                        <button onClick={generatePublicLink} className="text-blue-600 text-sm hover:underline">Generate Link</button>
                    ) : (
                        <div className="flex items-center gap-2 bg-gray-100 p-2 rounded">
                            <input readOnly value={generatedLink} className="bg-transparent text-sm flex-1 outline-none text-gray-600" />
                            <button onClick={copyToClipboard} className="text-gray-500 hover:text-gray-700">
                                <FaCopy />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Close</button>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
