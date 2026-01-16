import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { FaFolder, FaFile, FaTrash, FaFolderPlus, FaShareAlt, FaUsers } from 'react-icons/fa';
import FileUploader from '../components/FileUploader';
import CreateFolderModal from '../components/CreateFolderModal';
import ShareModal from '../components/ShareModal';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const getLastSegment = () => {
        const parts = window.location.pathname.split('/');
        const last = parts[parts.length - 1];
        if (last === 'my-drive') return null;
        return last;
    };

    const [currentFolderId, setCurrentFolderId] = useState(getLastSegment());
    const [contents, setContents] = useState({ folders: [], files: [], breadcrumbs: [] });
    const [loading, setLoading] = useState(true);
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [activeShareItem, setActiveShareItem] = useState(null);

    const fetchContents = async () => {
        setLoading(true);
        try {
            const url = currentFolderId ? `/folders/${currentFolderId}` : '/folders';
            const { data } = await api.get(url);
            setContents(data);
        } catch (error) {
            toast.error('Failed to load folder');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const id = getLastSegment();
        setCurrentFolderId(id);
    }, [window.location.pathname]);

    useEffect(() => {
        fetchContents();
    }, [currentFolderId]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleDeleteFile = async (id) => {
        if (!confirm('Move to trash?')) return;
        try {
            await api.delete(`/files/${id}`);
            toast.success('Moved to trash');
            fetchContents();
        } catch (error) {
            toast.error('Failed to delete');
        }
    }

    const handleDeleteFolder = async (id) => {
        if (!confirm('Move to trash?')) return;
        try {
            await api.delete(`/folders/${id}`);
            toast.success('Moved to trash');
            fetchContents();
        } catch (error) {
            toast.error('Failed to delete');
        }
    }

    return (
        <Layout user={user} onLogout={handleLogout}>
            <div className="p-8 h-full overflow-auto">
                <div className="max-w-6xl mx-auto">

                    {/* Toolbar */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold opacity-75">
                            {contents.breadcrumbs.length > 0 ? (
                                <div className="flex items-center gap-2">
                                    <Link to="/drive/my-drive" className="hover:underline text-gray-500">My Drive</Link>
                                    {contents.breadcrumbs.map(b => (
                                        <span key={b._id} className="flex items-center gap-2">
                                            <span className="text-gray-400">/</span>
                                            <Link to={`/drive/folders/${b._id}`} className="hover:underline text-gray-700">{b.name}</Link>
                                        </span>
                                    ))}
                                </div>
                            ) : 'My Drive'}
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowCreateFolder(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm"
                            >
                                <FaFolderPlus /> New Folder
                            </button>
                        </div>
                    </div>

                    <FileUploader parentId={currentFolderId} onUploadSuccess={fetchContents} />

                    {loading ? (
                        <div className="text-center py-10">Loading...</div>
                    ) : (
                        <>
                            {contents.folders.length === 0 && contents.files.length === 0 && (
                                <div className="text-gray-500 text-center py-20 border-2 border-dashed border-gray-300 rounded-lg">
                                    Empty folder. Upload files or create a subfolder.
                                </div>
                            )}

                            {/* Folders List */}
                            {contents.folders.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase">Folders</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {contents.folders.map(folder => (
                                            <div key={folder._id} className="group relative bg-white p-4 rounded-lg shadow-sm hover:shadow-md border border-gray-100 transition-all cursor-pointer">
                                                <Link to={`/drive/folders/${folder._id}`} className="block text-center" onClick={() => setTimeout(() => setCurrentFolderId(folder._id), 0)}>
                                                    <div className="relative inline-block">
                                                        <FaFolder className={`text-4xl mx-auto mb-2 ${folder.isShared ? 'text-blue-400' : 'text-yellow-400'}`} />
                                                        {folder.isShared && <FaUsers className="absolute bottom-0 right-0 text-gray-600 bg-white rounded-full p-0.5" size={12} />}
                                                    </div>
                                                    <div className="truncate text-sm font-medium text-gray-700">{folder.name}</div>
                                                </Link>
                                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-90 rounded p-1 shadow-sm">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setActiveShareItem({ id: folder._id, type: 'Folder' }); }}
                                                        className="text-gray-400 hover:text-blue-500"
                                                        title="Share"
                                                    >
                                                        <FaShareAlt size={12} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder._id); }}
                                                        className="text-gray-400 hover:text-red-500"
                                                        title="Delete"
                                                    >
                                                        <FaTrash size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Files List */}
                            {contents.files.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase">Files</h3>
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                                        {contents.files.map(file => (
                                            <div key={file._id} className="group flex items-center justify-between p-3 border-b border-gray-50 hover:bg-gray-50 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <FaFile className="text-gray-400 text-xl" />
                                                        {file.isShared && <FaUsers className="absolute -bottom-1 -right-1 text-blue-500 bg-white rounded-full p-0.5" size={10} />}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                            {file.name}
                                                            {file.isShared && <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded">Shared</span>}
                                                        </div>
                                                        <div className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setActiveShareItem({ id: file._id, type: 'File' })}
                                                        className="text-gray-400 hover:text-blue-600"
                                                        title="Share"
                                                    >
                                                        <FaShareAlt />
                                                    </button>
                                                    <a href={`http://localhost:5000/api/files/${file._id}/download`} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">Download</a>
                                                    <button onClick={() => handleDeleteFile(file._id)} className="text-red-500 hover:text-red-700" title="Delete">
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {showCreateFolder && (
                    <CreateFolderModal
                        parentId={currentFolderId}
                        onClose={() => setShowCreateFolder(false)}
                        onSuccess={fetchContents}
                    />
                )}

                {activeShareItem && (
                    <ShareModal
                        resourceId={activeShareItem.id}
                        resourceType={activeShareItem.type}
                        onClose={() => setActiveShareItem(null)}
                    />
                )}
            </div>
        </Layout>
    );
};

export default Dashboard;
