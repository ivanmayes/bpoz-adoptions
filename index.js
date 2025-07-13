require('dotenv').config()
const express = require('express')
const path = require('path')
const fs = require('fs').promises
const OpenAI = require('openai')

const port = process.env.PORT || 5006

const app = express()

// Initialize OpenAI only if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log('OpenAI client initialized successfully');
} else {
  console.warn('OpenAI API key not found - chat functionality will be limited');
}

// Load system prompt
let systemPrompt = ''
async function loadSystemPrompt() {
  try {
    systemPrompt = await fs.readFile(path.join(__dirname, 'adoptable-dogs/prompts/system.txt'), 'utf8')
    console.log('System prompt loaded successfully')
  } catch (error) {
    console.error('Error loading system prompt:', error)
    systemPrompt = 'You are a helpful adoption assistant. Always respond in JSON format with keys: reply, filter, animalIds, rationales.'
  }
}
loadSystemPrompt()

app.use(express.json())

// Allow iframe embedding from any origin
app.use((req, res, next) => {
  // Remove X-Frame-Options to allow iframe embedding
  res.removeHeader('X-Frame-Options');
  // Set Content Security Policy to allow framing from any origin
  res.setHeader('Content-Security-Policy', "frame-ancestors *;");
  next();
})

app.use(express.static(path.join(__dirname, 'public')))
app.use('/adoptable-dogs', express.static(path.join(__dirname, 'adoptable-dogs')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  console.log(`Redirecting to /adoptable-dogs`)
  res.redirect('/adoptable-dogs')
})

app.get('/adoptable-dogs', (req, res) => {
  console.log(`Serving adoptable dogs page`)
  res.sendFile(path.join(__dirname, 'adoptable-dogs', 'index.html'))
})

// SECURITY: Only return non-sensitive configuration
app.get('/api/env', (req, res) => {
  res.json({
    // DO NOT EXPOSE USERNAME OR PASSWORD
    ASM_ACCOUNT: process.env.ASM_ACCOUNT || 'km2607'
  })
})

// Proxy endpoint for animal thumbnails
app.get('/api/animal-thumbnail/:animalId', async (req, res) => {
  const https = require('https');
  const { animalId } = req.params;
  
  const queryParams = new URLSearchParams({
    account: process.env.ASM_ACCOUNT || 'km2607',
    method: 'animal_thumbnail',
    animalid: animalId,
    username: process.env.ASM_USERNAME,
    password: process.env.ASM_PASSWORD
  });
  
  const apiUrl = `https://service.sheltermanager.com/asmservice?${queryParams}`;
  
  https.get(apiUrl, (apiRes) => {
    res.status(apiRes.statusCode);
    res.set('Content-Type', apiRes.headers['content-type'] || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=3600'); // Cache images for 1 hour
    apiRes.pipe(res);
  }).on('error', (error) => {
    console.error('Thumbnail proxy error:', error);
    res.status(500).send('Failed to fetch thumbnail');
  });
});

// Proxy endpoint for animal images with sequence
app.get('/api/animal-image/:animalId/:seq', async (req, res) => {
  const https = require('https');
  const { animalId, seq } = req.params;
  
  const queryParams = new URLSearchParams({
    account: process.env.ASM_ACCOUNT || 'km2607',
    method: 'animal_image',
    animalid: animalId,
    seq: seq,
    username: process.env.ASM_USERNAME,
    password: process.env.ASM_PASSWORD
  });
  
  const apiUrl = `https://service.sheltermanager.com/asmservice?${queryParams}`;
  
  https.get(apiUrl, (apiRes) => {
    res.status(apiRes.statusCode);
    res.set('Content-Type', apiRes.headers['content-type'] || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=3600'); // Cache images for 1 hour
    apiRes.pipe(res);
  }).on('error', (error) => {
    console.error('Image proxy error:', error);
    res.status(500).send('Failed to fetch image');
  });
});

// Proxy endpoint for animal images (default to first image)
app.get('/api/animal-image/:animalId', async (req, res) => {
  const https = require('https');
  const { animalId, seq = 1 } = req.params;
  
  const queryParams = new URLSearchParams({
    account: process.env.ASM_ACCOUNT || 'km2607',
    method: 'animal_image',
    animalid: animalId,
    seq: seq,
    username: process.env.ASM_USERNAME,
    password: process.env.ASM_PASSWORD
  });
  
  const apiUrl = `https://service.sheltermanager.com/asmservice?${queryParams}`;
  
  https.get(apiUrl, (apiRes) => {
    res.status(apiRes.statusCode);
    res.set('Content-Type', apiRes.headers['content-type'] || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=3600'); // Cache images for 1 hour
    apiRes.pipe(res);
  }).on('error', (error) => {
    console.error('Image proxy error:', error);
    res.status(500).send('Failed to fetch image');
  });
});

// API proxy for data endpoints (json_adoptable_animals, etc)
app.get('/api/asm/:method', async (req, res) => {
  const https = require('https');
  const { method } = req.params;
  
  // Only allow specific safe methods
  const allowedMethods = ['json_adoptable_animals', 'json_recent_adoptions'];
  if (!allowedMethods.includes(method)) {
    return res.status(403).json({ error: 'Method not allowed' });
  }
  
  const queryParams = new URLSearchParams({
    account: process.env.ASM_ACCOUNT || 'km2607',
    method: method,
    username: process.env.ASM_USERNAME,
    password: process.env.ASM_PASSWORD
  });
  
  const apiUrl = `https://service.sheltermanager.com/asmservice?${queryParams}`;
  console.log(`Proxying ASM API request: ${method}`);
  
  try {
    https.get(apiUrl, (apiRes) => {
      let data = '';
      
      apiRes.on('data', chunk => {
        data += chunk;
      });
      
      apiRes.on('end', () => {
        try {
          // Parse JSON response
          const jsonData = JSON.parse(data);
          
          // Clean up PHOTOURLS to remove credentials
          const cleanedData = jsonData.map(animal => {
            if (animal.PHOTOURLS && Array.isArray(animal.PHOTOURLS)) {
              animal.PHOTOURLS = animal.PHOTOURLS.map(url => {
                // Remove username and password parameters from URLs
                try {
                  const urlObj = new URL(url);
                  urlObj.searchParams.delete('username');
                  urlObj.searchParams.delete('password');
                  return urlObj.toString();
                } catch (e) {
                  // If URL parsing fails, return original
                  return url;
                }
              });
            }
            return animal;
          });
          
          res.status(apiRes.statusCode);
          res.json(cleanedData);
        } catch (parseError) {
          // If not JSON or parsing fails, return as-is
          res.status(apiRes.statusCode);
          res.send(data);
        }
      });
    }).on('error', (error) => {
      console.error('API proxy error:', error);
      res.status(500).json({ error: 'Failed to fetch from ASM API' });
    });
  } catch (error) {
    console.error('API proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch from ASM API' });
  }
})

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, context } = req.body
    
    // Check if OpenAI client is initialized
    if (!openai) {
      console.log('OpenAI client not initialized')
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        reply: "I'm not properly configured yet. The OpenAI API key needs to be set in the environment variables.",
        filter: false
      })
    }
    
    // Build messages array for OpenAI
    const openAIMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ]
    
    // Add context about available animals if provided
    if (context) {
      openAIMessages.push({
        role: 'system',
        content: `AVAILABLE ANIMALS:\n${context}\n\nBased on the user's preferences and this list of available animals, provide recommendations.`
      })
    }
    
    console.log('Sending chat request to OpenAI with', openAIMessages.length, 'messages...')
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openAIMessages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500
    })
    
    const responseContent = completion.choices[0].message.content
    console.log('OpenAI response:', responseContent)
    
    // Parse and validate JSON response
    try {
      const parsed = JSON.parse(responseContent)
      res.json(parsed)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      res.json({
        reply: "I had trouble formatting my response. Let me try again.",
        filter: false
      })
    }
    
  } catch (error) {
    console.error('Chat API error:', error)
    res.status(500).json({ 
      error: 'Failed to process chat request',
      reply: "I'm having trouble connecting right now. Please try again in a moment.",
      filter: false
    })
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
