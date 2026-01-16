import { useState, useRef } from 'react';
import { uploadChunkedFile } from '../utils/api';
import toast from 'react-hot-toast';

const FileUploader = ({ parentId, onUploadSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setProgress(0);

        try {
            await uploadChunkedFile(file, parentId, (percent) => {
                setProgress(percent);
            });
            toast.success('File uploaded successfully!');
            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            toast.error('Upload failed.');
        } finally {
            setUploading(false);
            setProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="p-4 border rounded bg-white shadow-sm mb-4">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={uploading}
                className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
            />
            {uploading && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUploader;
