import { Link, useLocation } from 'react-router-dom';
import { FaHdd, FaTrash, FaShareAlt, FaCloud } from 'react-icons/fa';

const Layout = ({ children, user, onLogout }) => {
    const location = useLocation();
    const isActive = (path) => location.pathname.startsWith(path);

    return (
        <div className="flex bg-gray-50 h-screen">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center gap-2">
                    <FaCloud className="text-blue-600 text-2xl" />
                    <h1 className="text-xl font-bold text-gray-800">MyStorage</h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <Link to="/drive/my-drive" className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${isActive('/drive/my-drive') || isActive('/drive/folders') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <FaHdd /> My Drive
                    </Link>
                    <Link to="/drive/trash" className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${isActive('/drive/trash') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <FaTrash /> Trash
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">Storage ({((user?.storageUsed || 0) / 1024 / 1024).toFixed(2)} MB / {((user?.storageLimit || 0) / 1024 / 1024 / 1024).toFixed(2)} GB)</div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
                        <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${Math.min(((user?.storageUsed || 0) / (user?.storageLimit || 1)) * 100, 100)}%` }}>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-700 truncate w-32">{user?.name}</div>
                        <button onClick={onLogout} className="text-xs text-red-500 hover:underline">Logout</button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {children}
            </div>
        </div>
    );
};

export default Layout;
