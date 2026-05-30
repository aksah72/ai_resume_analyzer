const express = require('express');
const multer = require('multer');
const cors = require('cors');
const FormData = require('form-data');
const fs = require('fs');

const app = express();
app.use(cors());

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Health check
app.get('/', (req, res) => res.json({ status: 'upload-service running' }));

app.post('/upload', upload.single('resume'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const form = new FormData();
        form.append('resume', fs.createReadStream(req.file.path));

        // Use env var so it works both locally and via Docker
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5002';

        const response = await fetch(`${aiServiceUrl}/analyze`, {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const data = await response.json();
        res.json({ message: 'Upload successful', ...data });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Upload service error', error: err.message });
    }
});

app.listen(5001, () => console.log('Upload Service running on port 5001'));
