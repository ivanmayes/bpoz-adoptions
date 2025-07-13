require('dotenv').config()
const express = require('express')
const path = require('path')

const port = process.env.PORT || 5006

const app = express()

app.use(express.static(path.join(__dirname, 'public')))
app.use('/adoptable-dogs', express.static(path.join(__dirname, 'adoptable-dogs')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  console.log(`Rendering 'pages/index' for route '/'`)
  res.render('pages/index')
})

app.get('/adoptable-dogs', (req, res) => {
  console.log(`Serving adoptable dogs page`)
  res.sendFile(path.join(__dirname, 'adoptable-dogs', 'index.html'))
})

app.get('/api/env', (req, res) => {
  res.json({
    ASM_USERNAME: process.env.ASM_USERNAME,
    ASM_PASSWORD: process.env.ASM_PASSWORD,
    ASM_ACCOUNT: process.env.ASM_ACCOUNT
  })
})

// API proxy to handle potential CORS issues
app.get('/api/asm/:method', async (req, res) => {
  const https = require('https');
  const { method } = req.params;
  
  // Build query parameters, preserving any from the original request
  const queryParams = new URLSearchParams({
    account: process.env.ASM_ACCOUNT || 'km2607',
    method: method,
    username: process.env.ASM_USERNAME,
    password: process.env.ASM_PASSWORD,
    ...req.query
  });
  
  const apiUrl = `https://service.sheltermanager.com/asmservice?${queryParams}`;
  console.log(`Proxying ASM API request: ${method}`);
  
  try {
    // Use native https module to avoid potential fetch issues
    https.get(apiUrl, (apiRes) => {
      const contentType = apiRes.headers['content-type'];
      
      // Set the same status code
      res.status(apiRes.statusCode);
      
      // Forward relevant headers
      if (contentType) {
        res.set('Content-Type', contentType);
      }
      
      // Pipe the response directly
      apiRes.pipe(res);
    }).on('error', (error) => {
      console.error('API proxy error:', error);
      res.status(500).json({ error: 'Failed to fetch from ASM API' });
    });
  } catch (error) {
    console.error('API proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch from ASM API' });
  }
})

const server = app.listen(port, () => {
  console.log(`Listening on ${port}`)
})

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: gracefully shutting down')
  if (server) {
    server.close(() => {
      console.log('HTTP server closed')
    })
  }
})
