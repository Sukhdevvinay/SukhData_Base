import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
});

// Add interceptor to handle errors globally if needed
api.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
);

export const uploadChunkedFile = async (file, parentId, onProgress) => {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    try {
        // 1. Init Session
        const { data: { uploadId } } = await api.post('/files/upload-session', {
            fileName: file.name,
            fileSize: file.size,
            parentId
        });

        // 2. Upload Chunks
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const start = chunkIndex * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);

            await api.post('/files/upload-chunk', chunk, {
                headers: {
                    'x-upload-id': uploadId,
                    'x-chunk-index': chunkIndex,
                    'Content-Type': 'application/octet-stream'
                }
            });

            const percentCompleted = Math.round(((chunkIndex + 1) * 100) / totalChunks);
            onProgress(percentCompleted);
        }

        // 3. Complete Upload
        const { data: newFile } = await api.post('/files/complete-upload', { uploadId });
        return newFile;

    } catch (error) {
        console.error('Upload failed', error);
        throw error;
    }
}

export default api;
