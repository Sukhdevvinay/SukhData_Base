import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Trash from './pages/Trash';
import PublicShare from './pages/PublicShare';

function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/" element={<Navigate to="/drive/my-drive" />} />
                        <Route path="/drive/my-drive" element={<Dashboard />} />
                        <Route path="/drive/folders/:folderId" element={<Dashboard />} />
                        <Route path="/drive/trash" element={<Trash />} />
                        <Route path="/share/public/:token" element={<PublicShare />} />
                    </Routes>
                </div>
            </AuthProvider>
        </Router>
    )
}

export default App
