import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CreateFolderModal = ({ parentId, onClose, onSuccess }) => {
    const [name, setName] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/folders', { name, parentId });
            toast.success('Folder created');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('Failed to create folder');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded max-w-sm w-full p-6">
                <h3 className="text-lg font-bold mb-4">New Folder</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Folder Name"
                        className="w-full border p-2 rounded mb-4"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateFolderModal;
