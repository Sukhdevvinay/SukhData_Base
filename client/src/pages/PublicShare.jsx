import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios'; // Use raw axios to avoid interceptors if needed, or use api instance
import api from '../utils/api';
import { FaFile, FaFolder, FaDownload, FaExclamationTriangle } from 'react-icons/fa';

const PublicShare = () => {
    const { token } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchResource = async () => {
            try {
                const res = await api.get(`/share/public/${token}`);
                setData(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load resource');
            } finally {
                setLoading(false);
            }
        };
        fetchResource();
    }, [token]);

    const handleDownload = () => {
        // We need a specific public download endpoint OR we assume this is a direct file link if we had one.
        // For now, let's create a download URL that the backend can handle.
        window.location.href = `http://localhost:5000/api/share/public/${token}/download`;
    };

    if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
    if (error) return <div className="flex h-screen items-center justify-center text-red-500 gap-2"><FaExclamationTriangle /> {error}</div>;
    if (!data) return null;

    const { resource, permission } = data;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full text-center">
                <h1 className="text-2xl font-bold mb-2 break-all text-gray-800">{resource.name}</h1>
                <p className="text-gray-500 mb-6 text-sm">Shared by owner</p>

                <div className="flex justify-center mb-8">
                    {permission.resourceType === 'Folder' ? (
                        <FaFolder className="text-yellow-400 text-9xl" />
                    ) : (
                        <FaFile className="text-blue-500 text-9xl" />
                    )}
                </div>

                {permission.resourceType === 'Folder' ? (
                    <div className="text-gray-600">
                        <p>This is a shared folder.</p>
                        {/* TODO: List children if backend sends them */}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="text-sm text-gray-500">
                            Size: {(resource.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                        <button
                            onClick={handleDownload}
                            className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 w-full"
                        >
                            <FaDownload /> Download File
                        </button>
                    </div>
                )}

                <div className="mt-8 pt-4 border-t border-gray-100 text-xs text-gray-400">
                    Trusted Storage Link
                </div>
            </div>
        </div>
    );
};

export default PublicShare;
