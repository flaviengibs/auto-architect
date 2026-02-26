/**
 * Auto-Architect Web Server
 * 
 * Backend server for the web interface that:
 * - Serves the web interface
 * - Accepts file uploads
 * - Runs Auto-Architect analysis
 * - Returns results as JSON
 */

const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads', Date.now().toString());
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Serve web interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Upload and analyze endpoint
app.post('/api/analyze', upload.array('files'), async (req, res) => {
  try {
    const files = req.files;
    const options = JSON.parse(req.body.options || '{}');

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Get upload directory
    const uploadDir = path.dirname(files[0].path);

    // Build Auto-Architect command
    const cliPath = path.join(__dirname, '..', 'dist', 'cli', 'index.js');
    
    // Check if CLI exists
    if (!fs.existsSync(cliPath)) {
      return res.status(500).json({ 
        error: 'Auto-Architect CLI not found. Please run "npm run build" in the root directory.' 
      });
    }
    
    let command = `node "${cliPath}" analyze "${uploadDir}" --format json`;

    // Add options
    if (options.security) command += ' --security';
    if (options.performance) command += ' --performance';
    if (options.git) command += ' --git';
    if (options.docs) command += ' --docs';
    if (options.heatmap) command += ' --heatmap';
    if (options.trends) command += ' --trends';
    if (options.team) command += ' --team';
    if (options.compare) command += ' --compare-industry';
    if (options.refactoringPlan) command += ' --refactoring-plan';
    if (options.threshold) command += ` --threshold ${options.threshold}`;

    console.log('Running command:', command);

    // Execute analysis (50MB buffer to handle large outputs)
    exec(command, { maxBuffer: 50 * 1024 * 1024 }, (error, stdout, stderr) => {
      console.log('Command completed');
      console.log('Error:', error ? error.message : 'none');
      console.log('Stdout length:', stdout ? stdout.length : 0);
      console.log('Stderr:', stderr || 'none');

      // Check if we got JSON output even with error code
      // (CLI exits with code 1 if health score is below threshold or other issues)
      if (stdout && stdout.trim()) {
        // Find JSON in output (skip console output before JSON)
        const jsonStart = stdout.indexOf('{');
        if (jsonStart !== -1) {
          const jsonOutput = stdout.substring(jsonStart);
          console.log('Found JSON starting at position:', jsonStart);
          console.log('JSON output length:', jsonOutput.length);
          console.log('First 100 chars:', jsonOutput.substring(0, 100));
          console.log('Last 100 chars:', jsonOutput.substring(jsonOutput.length - 100));
          
          try {
            const results = JSON.parse(jsonOutput);
            console.log('Successfully parsed JSON from stdout');
            
            // Clean up uploaded files after successful parsing
            fs.rmSync(uploadDir, { recursive: true, force: true });
            
            return res.json(results);
          } catch (parseError) {
            console.error('Failed to parse JSON:', parseError.message);
            console.error('Parse error at position:', parseError.message.match(/position (\d+)/)?.[1]);
            console.error('JSON around error (first 500 chars):', jsonOutput.substring(0, 500));
            console.error('JSON around error (last 500 chars):', jsonOutput.substring(Math.max(0, jsonOutput.length - 500)));
          }
        } else {
          console.error('No JSON found in stdout. Output:', stdout.substring(0, 500));
        }
      } else {
        console.error('No stdout received from CLI');
      }

      // If we get here, analysis truly failed
      // Clean up uploaded files
      fs.rmSync(uploadDir, { recursive: true, force: true });
      
      if (error) {
        console.error('Analysis error:', error);
        return res.status(500).json({ 
          error: 'Analysis failed', 
          details: stderr || error.message,
          command: command,
          stdout: stdout ? stdout.substring(0, 2000) : 'none',
          hint: 'Check if JSON output exists in stdout. The CLI may have produced output but exited with error code.'
        });
      }

      // No error but no valid JSON either
      res.status(500).json({ 
        error: 'No valid output from analysis',
        stdout: stdout ? stdout.substring(0, 500) : 'none'
      });
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '3.2.0' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🏗️  Auto-Architect Web Server                        ║
║                                                       ║
║   Server running on: http://localhost:${PORT}            ║
║   Version: 3.2.0                                      ║
║                                                       ║
║   Open your browser and start analyzing!              ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});
