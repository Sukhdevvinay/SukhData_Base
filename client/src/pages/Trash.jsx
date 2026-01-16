import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaTrashRestore, FaTimes, FaFolder, FaFile } from 'react-icons/fa';

const Trash = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [items, setItems] = useState({ folders: [], files: [] });
    const [loading, setLoading] = useState(true);

    const fetchTrash = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/trash');
            setItems(data);
        } catch (error) {
            toast.error('Failed to load trash');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrash();
    }, []);

    const handleRestore = async (type, id) => {
        try {
            await api.put(`/trash/${type}/${id}/restore`);
            toast.success('Restored');
            fetchTrash();
        } catch (error) {
            toast.error('Failed to restore');
        }
    };

    const handleDeletePermanent = async (type, id) => {
        if (!confirm('Permanently delete? This cannot be undone.')) return;
        try {
            await api.delete(`/trash/${type}/${id}`);
            toast.success('Deleted permanently');
            // Update user storage locally or refetch profile? 
            // Ideally refetch profile to update sidebar quota, assuming context exposes a refresh.
            // For now, simple fetchTrash.
            fetchTrash();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <Layout user={user} onLogout={handleLogout}>
            <div className="p-8 overflow-auto h-full">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Trash</h2>

                {loading ? <p>Loading...</p> : (
                    <>
                        {items.folders.length === 0 && items.files.length === 0 && (
                            <div className="text-gray-500">Trash is empty.</div>
                        )}

                        <div className="space-y-2">
                            {items.folders.map(folder => (
                                <div key={folder._id} className="flex items-center justify-between p-4 bg-white rounded shadow-sm border border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <FaFolder className="text-gray-400 text-xl" />
                                        <span className="font-medium">{folder.name}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleRestore('folder', folder._id)} className="text-blue-600 hover:bg-blue-50 p-2 rounded" title="Restore"><FaTrashRestore /></button>
                                        <button onClick={() => handleDeletePermanent('folder', folder._id)} className="text-red-600 hover:bg-red-50 p-2 rounded" title="Delete Permanently"><FaTimes /></button>
                                    </div>
                                </div>
                            ))}
                            {items.files.map(file => (
                                <div key={file._id} className="flex items-center justify-between p-4 bg-white rounded shadow-sm border border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <FaFile className="text-gray-400 text-xl" />
                                        <div>
                                            <div className="font-medium">{file.name}</div>
                                            <div className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleRestore('file', file._id)} className="text-blue-600 hover:bg-blue-50 p-2 rounded" title="Restore"><FaTrashRestore /></button>
                                        <button onClick={() => handleDeletePermanent('file', file._id)} className="text-red-600 hover:bg-red-50 p-2 rounded" title="Delete Permanently"><FaTimes /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
};

export default Trash;
