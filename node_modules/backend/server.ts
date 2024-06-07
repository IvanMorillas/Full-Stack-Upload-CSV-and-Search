import express from 'express'
import cors from 'cors'
import multer from 'multer'
import csvToJson from 'convert-csv-to-json'

const app = express();
const port = 3000;

// Multer configuration (middleware for handling multipart/form-data)
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

let userData: Array<Record<string, string>> = [];

//Enable CORS
app.use(cors()) 

// Endpoint to upload files
app.post('/api/files', upload.single('file'), async (req, res) => {
    // 1. Extract file from request
    const { file } = req;
    // 2. Validate that we have file
    if (!file) return res.status(500).json({ message: 'No file uploaded' });
    // 3. Validate the mimetype (csv)
    if(file.mimetype !== 'text/csv') return res.status(500).json({ message: 'Invalid file type, it must be CSV' });
    
    let json: Array<Record<string, string>> = [];

    try {
        // 4. Transform the file (Buffer) to string
        const rawCsv = Buffer.from(file.buffer).toString('utf-8');
        console.log(rawCsv);
        // 5. Transform the string (csv) to JSON
        json = csvToJson.fieldDelimiter(',').csvStringToJson(rawCsv);
    }catch(error){
        return res.status(500).json({ message: 'Error parsing CSV file' });
    }
    // 6. Save the JSON to database (or memory)
    userData = json;
    // 7. Return 200 with the message and the JSON
    return res.status(200).json({ data: json, message: 'File uploaded successfully' });
})

app.get('/api/users', async (req, res) => {
    // 1. Extract the query param 'q' from the request
    const { q } = req.query;
    // 2. Validate that we have the query param
    if (!q) return res.status(500).json({ message: 'No query param provided' });
    // 3. Filter the data from the database (or memory) based on the query param
    const search = q.toString().toLowerCase();

    const filteredData = userData.filter(row => {
        return Object.values(row).some(value => value.toLowerCase().includes(search));
    });
    // 4. Return 200 with the filtered data
    return res.status(200).json({ data: filteredData });
})

// Listen on port 3000
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
})