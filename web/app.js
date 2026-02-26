// Global state
let uploadedFiles = [];
let analysisResults = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupDragAndDrop();
  setupFileInput();
});

// Drag and Drop
function setupDragAndDrop() {
  const uploadArea = document.getElementById('uploadArea');

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const items = e.dataTransfer.items;
    handleDroppedItems(items);
  });
}

// Handle dropped items
async function handleDroppedItems(items) {
  console.log('handleDroppedItems called with', items.length, 'items');
  const files = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i].webkitGetAsEntry();
    if (item) {
      await traverseFileTree(item, files);
    }
  }
  
  console.log('Collected', files.length, 'files from drop');
  processFiles(files);
}

// Traverse file tree
async function traverseFileTree(item, files, path = '') {
  return new Promise((resolve) => {
    if (item.isFile) {
      item.file((file) => {
        files.push({ file, path: path + file.name });
        resolve();
      });
    } else if (item.isDirectory) {
      const dirReader = item.createReader();
      dirReader.readEntries(async (entries) => {
        for (const entry of entries) {
          await traverseFileTree(entry, files, path + item.name + '/');
        }
        resolve();
      });
    }
  });
}

// Setup file input
function setupFileInput() {
  const fileInput = document.getElementById('fileInput');
  
  fileInput.addEventListener('change', (e) => {
    try {
      const files = Array.from(e.target.files);
      
      if (files.length === 0) {
        console.log('No files selected');
        return;
      }
      
      const fileObjects = files.map(file => ({
        file,
        path: file.webkitRelativePath || file.name
      }));
      
      console.log(`Selected ${fileObjects.length} files`);
      processFiles(fileObjects);
    } catch (error) {
      console.error('Error processing files:', error);
      alert('Error loading files: ' + error.message);
    }
  });
}

// Select individual files (fallback)
function selectIndividualFiles() {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = '.ts,.tsx,.js,.jsx,.py,.java,.go,.cs,.php,.rb,.rs,.kt,.swift,.c,.h,.cpp,.hpp,.html,.vb,.R,.sql,.pas';
  
  input.addEventListener('change', (e) => {
    const files = Array.from(e.target.files).map(file => ({
      file,
      path: file.name
    }));
    
    if (files.length > 0) {
      processFiles(files);
    }
  });
  
  input.click();
}

// Process uploaded files
function processFiles(files) {
  console.log('processFiles called with', files.length, 'files');
  
  // Filter supported file types
  const supportedExtensions = [
    '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.cs',
    '.php', '.rb', '.rs', '.kt', '.kts', '.swift', '.c', '.h',
    '.cpp', '.cc', '.cxx', '.hpp', '.html', '.htm', '.vb',
    '.R', '.sql', '.pas', '.pp'
  ];

  uploadedFiles = files.filter(({ file }) => {
    const ext = file.name.substring(file.name.lastIndexOf('.'));
    const isSupported = supportedExtensions.includes(ext);
    if (!isSupported) {
      console.log('Skipping unsupported file:', file.name);
    }
    return isSupported;
  });

  console.log('Filtered to', uploadedFiles.length, 'supported files');

  if (uploadedFiles.length === 0) {
    alert('No supported files found. Please upload a project with code files.\n\nSupported: ' + supportedExtensions.join(', '));
    return;
  }

  displayFileList();
  showSection('optionsSection');
}

// Display file list
function displayFileList() {
  const fileList = document.getElementById('fileList');
  const fileCount = document.getElementById('fileCount');
  const fileListContent = document.getElementById('fileListContent');

  fileCount.textContent = uploadedFiles.length;
  fileListContent.innerHTML = '';

  uploadedFiles.slice(0, 50).forEach(({ file, path }) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
      <span class="file-icon">${getFileIcon(file.name)}</span>
      <span class="file-name">${path}</span>
      <span class="file-size">${formatFileSize(file.size)}</span>
    `;
    fileListContent.appendChild(item);
  });

  if (uploadedFiles.length > 50) {
    const more = document.createElement('div');
    more.className = 'file-item';
    more.innerHTML = `<span>... and ${uploadedFiles.length - 50} more files</span>`;
    fileListContent.appendChild(more);
  }

  fileList.style.display = 'block';
}

// Get file icon
function getFileIcon(filename) {
  const ext = filename.substring(filename.lastIndexOf('.'));
  const icons = {
    '.ts': '📘', '.tsx': '📘', '.js': '📙', '.jsx': '📙',
    '.py': '🐍', '.java': '☕', '.go': '🐹', '.cs': '🔷',
    '.php': '🐘', '.rb': '💎', '.rs': '🦀', '.kt': '🎯',
    '.swift': '🦅', '.c': '⚙️', '.h': '⚙️', '.cpp': '⚙️',
    '.html': '🌐', '.sql': '🗄️', '.R': '📊'
  };
  return icons[ext] || '📄';
}

// Format file size
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Clear files
function clearFiles() {
  uploadedFiles = [];
  document.getElementById('fileList').style.display = 'none';
  document.getElementById('fileInput').value = '';
  showSection('uploadSection');
}

// Update threshold value
function updateThresholdValue(type, value) {
  document.getElementById(`threshold${type.charAt(0).toUpperCase() + type.slice(1)}Value`).textContent = value;
}

// Reset options
function resetOptions() {
  document.querySelectorAll('.options-section input[type="checkbox"]:not(:disabled)').forEach(cb => {
    cb.checked = false;
  });
  document.getElementById('thresholdHealth').value = 70;
  updateThresholdValue('health', 70);
}

// Start analysis
async function startAnalysis() {
  if (uploadedFiles.length === 0) {
    alert('Please upload files first');
    return;
  }

  // Get options
  const options = {
    security: document.getElementById('optSecurity').checked,
    performance: document.getElementById('optPerformance').checked,
    git: document.getElementById('optGit').checked,
    docs: document.getElementById('optDocs').checked,
    heatmap: document.getElementById('optHeatmap').checked,
    diagram: document.getElementById('optDiagram').checked,
    trends: document.getElementById('optTrends').checked,
    team: document.getElementById('optTeam').checked,
    compare: document.getElementById('optCompare').checked,
    refactoringPlan: document.getElementById('optRefactoringPlan').checked,
    threshold: parseInt(document.getElementById('thresholdHealth').value)
  };

  showSection('progressSection');
  
  try {
    // Try to use backend API first
    const useBackend = await checkBackendAvailable();
    
    if (useBackend) {
      await runRealAnalysis(options);
    } else {
      // Fallback to simulated analysis
      await simulateAnalysis(options);
    }
    
    // Show results
    showSection('resultsSection');
    displayResults();
  } catch (error) {
    alert('Analysis failed: ' + error.message);
    showSection('optionsSection');
  }
}

// Check if backend is available
async function checkBackendAvailable() {
  try {
    const response = await fetch('http://localhost:3000/api/health', {
      method: 'GET',
      timeout: 2000
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Run real analysis via backend
async function runRealAnalysis(options) {
  const progressText = document.getElementById('progressText');
  const progressFill = document.getElementById('progressFill');
  
  progressText.textContent = 'Uploading files to server...';
  progressFill.style.width = '10%';
  
  // Create FormData with files
  const formData = new FormData();
  
  for (const { file, path } of uploadedFiles) {
    formData.append('files', file, path);
  }
  
  formData.append('options', JSON.stringify(options));
  
  progressText.textContent = 'Running analysis on server...';
  progressFill.style.width = '30%';
  
  try {
    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Server error details:', error);
      throw new Error(error.error + (error.details ? '\n\nDetails: ' + error.details : ''));
    }
    
    progressFill.style.width = '90%';
    progressText.textContent = 'Processing results...';
    
    analysisResults = await response.json();
    analysisResults.isRealAnalysis = true;
    analysisResults.projectName = getProjectName();
    
    progressFill.style.width = '100%';
    progressText.textContent = 'Analysis complete!';
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
  } catch (error) {
    console.error('Backend analysis failed:', error);
    throw error;
  }
}

// Simulate analysis
async function simulateAnalysis(options) {
  const steps = [
    { text: 'Parsing files...', duration: 1000 },
    { text: 'Building dependency graph...', duration: 1500 },
    { text: 'Calculating metrics...', duration: 1200 },
    { text: 'Detecting anti-patterns...', duration: 1000 },
    { text: 'Generating proposals...', duration: 800 }
  ];

  if (options.security) steps.push({ text: 'Security analysis...', duration: 1000 });
  if (options.performance) steps.push({ text: 'Performance analysis...', duration: 1000 });
  if (options.git) steps.push({ text: 'Git history analysis...', duration: 1200 });
  if (options.team) steps.push({ text: 'Team analytics...', duration: 1000 });

  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const progressSteps = document.getElementById('progressSteps');

  progressSteps.innerHTML = '';
  steps.forEach((step, i) => {
    const stepEl = document.createElement('div');
    stepEl.className = 'progress-step';
    stepEl.id = `step-${i}`;
    stepEl.innerHTML = `<span class="step-icon">⏳</span><span>${step.text}</span>`;
    progressSteps.appendChild(stepEl);
  });

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepEl = document.getElementById(`step-${i}`);
    
    stepEl.classList.add('active');
    stepEl.querySelector('.step-icon').textContent = '⚙️';
    progressText.textContent = step.text;
    
    const progress = ((i + 1) / steps.length) * 100;
    progressFill.style.width = progress + '%';
    
    await new Promise(resolve => setTimeout(resolve, step.duration));
    
    stepEl.classList.remove('active');
    stepEl.classList.add('completed');
    stepEl.querySelector('.step-icon').textContent = '✅';
  }

  // Generate mock results
  analysisResults = generateMockResults(options);
}

// Generate mock results
function generateMockResults(options) {
  const fileCount = uploadedFiles.length;
  const totalLines = fileCount * 150; // Estimate
  
  // Get actual file names from uploaded files
  const actualFiles = uploadedFiles.slice(0, 10).map(f => f.path);
  const largestFiles = actualFiles.slice(0, 3);
  
  // Generate realistic anti-patterns based on actual files
  const antiPatterns = [];
  if (largestFiles.length > 0) {
    antiPatterns.push({
      type: 'god-module',
      severity: 'high',
      module: largestFiles[0],
      description: 'Module has too many responsibilities'
    });
  }
  if (largestFiles.length > 1) {
    antiPatterns.push({
      type: 'tight-coupling',
      severity: 'medium',
      module: largestFiles[1],
      description: 'High coupling with other modules'
    });
  }
  if (largestFiles.length > 2) {
    antiPatterns.push({
      type: 'long-parameter-list',
      severity: 'low',
      module: largestFiles[2],
      description: 'Function has too many parameters'
    });
  }
  
  // Generate proposals based on actual files
  const proposals = [];
  if (largestFiles.length > 0) {
    proposals.push({
      type: 'split-module',
      priority: 'high',
      target: [largestFiles[0]],
      description: 'Split large module into smaller components',
      effort: 8
    });
  }
  if (largestFiles.length > 1) {
    proposals.push({
      type: 'extract-interface',
      priority: 'medium',
      target: [largestFiles[1]],
      description: 'Extract interface to reduce coupling',
      effort: 4
    });
  }
  
  return {
    healthScore: {
      overall: Math.floor(Math.random() * 30) + 60,
      architecture: Math.floor(Math.random() * 30) + 65,
      maintainability: Math.floor(Math.random() * 30) + 60,
      testability: Math.floor(Math.random() * 30) + 55,
      security: Math.floor(Math.random() * 30) + 70,
      performance: Math.floor(Math.random() * 30) + 65,
      grade: 'B'
    },
    metrics: {
      totalModules: fileCount,
      totalLines: totalLines,
      avgDependencies: (Math.random() * 5 + 2).toFixed(1),
      cyclomaticComplexity: (Math.random() * 10 + 5).toFixed(1),
      coupling: (Math.random() * 40 + 20).toFixed(1),
      cohesion: (Math.random() * 30 + 60).toFixed(1),
      maintainabilityIndex: (Math.random() * 30 + 60).toFixed(1),
      testCoverage: (Math.random() * 40 + 30).toFixed(1),
      technicalDebt: (Math.random() * 20 + 10).toFixed(1)
    },
    antiPatterns: antiPatterns,
    proposals: proposals,
    projectName: getProjectName()
  };
}

// Get project name from uploaded files
function getProjectName() {
  if (uploadedFiles.length === 0) return 'project';
  
  // Try to extract project name from path
  const firstPath = uploadedFiles[0].path;
  const parts = firstPath.split('/');
  
  if (parts.length > 1) {
    return parts[0].toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }
  
  return 'project';
}

// Get language breakdown
function getLanguageBreakdown() {
  const languages = {};
  
  uploadedFiles.forEach(({ file }) => {
    const ext = file.name.substring(file.name.lastIndexOf('.'));
    const langMap = {
      '.java': 'Java',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.py': 'Python',
      '.go': 'Go',
      '.cs': 'C#',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.rs': 'Rust',
      '.kt': 'Kotlin',
      '.swift': 'Swift',
      '.c': 'C',
      '.h': 'C',
      '.cpp': 'C++',
      '.html': 'HTML',
      '.sql': 'SQL',
      '.R': 'R',
      '.vb': 'VB',
      '.pas': 'Pascal'
    };
    
    const lang = langMap[ext] || 'Other';
    languages[lang] = (languages[lang] || 0) + 1;
  });
  
  return Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .map(([lang, count]) => `${count} ${lang}`)
    .join(', ');
}

// Display results
function displayResults() {
  const { healthScore, metrics, antiPatterns, proposals } = analysisResults;
  const isDemoMode = !analysisResults.isRealAnalysis;

  // Update mode banner
  const banner = document.getElementById('analysisModeBanner');
  banner.style.display = 'block';
  
  if (isDemoMode) {
    banner.style.background = '#fff3cd';
    banner.style.border = '2px solid #ffc107';
    banner.style.borderRadius = '8px';
    banner.style.padding = '20px';
    banner.style.marginBottom = '20px';
    banner.innerHTML = `
      <h3 style="color: #856404; margin-bottom: 10px;">⚠️ Demo Mode - Simulated Results</h3>
      <p style="color: #856404; margin-bottom: 10px;">
        These results are generated using mock data for demonstration purposes. 
        The file names and issues shown are based on your uploaded files but the analysis is simulated.
      </p>
      <p style="color: #856404;">
        <strong>For real analysis:</strong> Run the backend server with <code style="background: #fff; padding: 2px 6px; border-radius: 3px;">npm start</code> in the web/ directory.
      </p>
    `;
  } else {
    banner.style.background = '#d4edda';
    banner.style.border = '2px solid #28a745';
    banner.style.borderRadius = '8px';
    banner.style.padding = '20px';
    banner.style.marginBottom = '20px';
    banner.innerHTML = `
      <h3 style="color: #155724; margin-bottom: 10px;">✅ Real Analysis Complete</h3>
      <p style="color: #155724;">
        These results are from actual code analysis performed by the Auto-Architect engine.
        All metrics, issues, and proposals are based on real analysis of your code.
      </p>
    `;
  }

  // Health score
  document.getElementById('scoreValue').textContent = healthScore.overall;
  document.getElementById('gradeBadge').textContent = healthScore.grade;
  
  const scoreCircle = document.getElementById('scoreCircle');
  scoreCircle.style.background = getScoreColor(healthScore.overall);

  // Health details
  const healthDetails = document.getElementById('healthDetails');
  healthDetails.innerHTML = `
    <div class="health-metric">
      <div class="health-metric-value">${healthScore.architecture}</div>
      <div class="health-metric-label">Architecture</div>
    </div>
    <div class="health-metric">
      <div class="health-metric-value">${healthScore.maintainability}</div>
      <div class="health-metric-label">Maintainability</div>
    </div>
    <div class="health-metric">
      <div class="health-metric-value">${healthScore.testability}</div>
      <div class="health-metric-label">Testability</div>
    </div>
    <div class="health-metric">
      <div class="health-metric-value">${healthScore.security}</div>
      <div class="health-metric-label">Security</div>
    </div>
  `;

  // Overview tab
  document.getElementById('overviewTab').innerHTML = `
    ${isDemoMode ? `
    <div class="card" style="background: #fff3cd; border-left: 4px solid #ffc107;">
      <h3 style="color: #856404;">⚠️ Demo Mode</h3>
      <p style="color: #856404;">
        This is a demonstration with simulated results. The analysis uses mock data based on your uploaded files.
        For real analysis, run the backend server (see README.md).
      </p>
      <p style="color: #856404; margin-top: 10px;">
        <strong>Files detected:</strong> ${uploadedFiles.length} files (${getLanguageBreakdown()})
      </p>
    </div>
    ` : `
    <div class="card" style="background: #d4edda; border-left: 4px solid #28a745;">
      <h3 style="color: #155724;">✅ Real Analysis</h3>
      <p style="color: #155724;">
        This is a real analysis performed by the Auto-Architect engine.
        Results are based on actual code analysis, not simulated data.
      </p>
    </div>
    `}
    <div class="card">
      <h3>Project Summary</h3>
      <div class="metric-grid">
        <div class="metric-item">
          <div class="metric-value">${metrics.totalModules}</div>
          <div class="metric-label">Modules</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${metrics.totalLines.toLocaleString()}</div>
          <div class="metric-label">Lines of Code${isDemoMode ? ' (estimated)' : ''}</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${antiPatterns.length}</div>
          <div class="metric-label">Issues Found${isDemoMode ? ' (simulated)' : ''}</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${proposals.length}</div>
          <div class="metric-label">Proposals${isDemoMode ? ' (simulated)' : ''}</div>
        </div>
      </div>
    </div>
    ${isDemoMode ? `
    <div class="card">
      <h3>Uploaded Files (first 10)</h3>
      <div style="max-height: 300px; overflow-y: auto;">
        ${uploadedFiles.slice(0, 10).map(f => `
          <div style="padding: 8px; background: #f7fafc; margin-bottom: 5px; border-radius: 4px; display: flex; gap: 10px;">
            <span>${getFileIcon(f.file.name)}</span>
            <span style="flex: 1; font-family: monospace; font-size: 0.9em;">${f.path}</span>
            <span style="color: #718096; font-size: 0.85em;">${formatFileSize(f.file.size)}</span>
          </div>
        `).join('')}
        ${uploadedFiles.length > 10 ? `<p style="color: #718096; margin-top: 10px;">... and ${uploadedFiles.length - 10} more files</p>` : ''}
      </div>
    </div>
    ` : ''}
  `;

  // Metrics tab
  document.getElementById('metricsTab').innerHTML = `
    <div class="card">
      <h3>Architecture Metrics</h3>
      <div class="metric-grid">
        <div class="metric-item">
          <div class="metric-value">${metrics.avgDependencies}</div>
          <div class="metric-label">Avg Dependencies</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${metrics.cyclomaticComplexity}</div>
          <div class="metric-label">Complexity</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${metrics.coupling}%</div>
          <div class="metric-label">Coupling</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${metrics.cohesion}%</div>
          <div class="metric-label">Cohesion</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${metrics.maintainabilityIndex}</div>
          <div class="metric-label">Maintainability</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${metrics.testCoverage}%</div>
          <div class="metric-label">Test Coverage</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${metrics.technicalDebt}%</div>
          <div class="metric-label">Technical Debt</div>
        </div>
      </div>
    </div>
  `;

  // Issues tab
  document.getElementById('issuesTab').innerHTML = `
    <div class="card">
      <h3>Anti-Patterns Detected</h3>
      <div class="issue-list">
        ${antiPatterns.map(issue => `
          <div class="issue-item ${issue.severity}">
            <div class="issue-title">${issue.type} in ${issue.module}</div>
            <div class="issue-description">${issue.description}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Refactoring tab
  document.getElementById('refactoringTab').innerHTML = `
    <div class="card">
      <h3>Refactoring Proposals</h3>
      <div class="issue-list">
        ${proposals.map(proposal => `
          <div class="issue-item ${proposal.priority}">
            <div class="issue-title">${proposal.type} - ${proposal.target.join(', ')}</div>
            <div class="issue-description">${proposal.description}</div>
            <div class="issue-description">Estimated effort: ${proposal.effort} hours</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Visualizations tab
  document.getElementById('visualizationsTab').innerHTML = `
    <div class="card">
      <h3>Visualizations</h3>
      <p>Visualizations would be generated here (diagrams, heatmaps, charts)</p>
      <p>In the full implementation, this would show:</p>
      <ul>
        <li>Dependency graph (Mermaid diagram)</li>
        <li>Complexity heatmap</li>
        <li>Trend charts</li>
        <li>Team analytics charts</li>
      </ul>
    </div>
  `;
}

// Get score color
function getScoreColor(score) {
  if (score >= 80) return 'rgba(72, 187, 120, 0.3)';
  if (score >= 60) return 'rgba(66, 153, 225, 0.3)';
  if (score >= 40) return 'rgba(237, 137, 54, 0.3)';
  return 'rgba(245, 101, 101, 0.3)';
}

// Show tab
function showTab(tabName) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  
  event.target.classList.add('active');
  document.getElementById(tabName + 'Tab').classList.add('active');
}

// Export results
function exportResults(format) {
  if (!analysisResults) return;

  const projectName = analysisResults.projectName || 'project';
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  let content, filename, mimeType;

  switch (format) {
    case 'json':
      content = JSON.stringify(analysisResults, null, 2);
      filename = `${projectName}-analysis-${timestamp}.json`;
      mimeType = 'application/json';
      break;
    
    case 'html':
      content = generateHTMLReport();
      filename = `${projectName}-report-${timestamp}.html`;
      mimeType = 'text/html';
      break;
    
    case 'markdown':
      content = generateMarkdownReport();
      filename = `${projectName}-report-${timestamp}.md`;
      mimeType = 'text/markdown';
      break;
    
    case 'csv':
      content = generateCSVReport();
      filename = `${projectName}-metrics-${timestamp}.csv`;
      mimeType = 'text/csv';
      break;
  }

  downloadFile(content, filename, mimeType);
}

// Generate HTML report
function generateHTMLReport() {
  const { healthScore, metrics, antiPatterns, proposals } = analysisResults;
  
  return `<!DOCTYPE html>
<html>
<head>
  <title>Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #667eea; }
    .metric { display: inline-block; margin: 20px; text-align: center; }
    .metric-value { font-size: 2em; font-weight: bold; }
    .issue { padding: 10px; margin: 10px 0; border-left: 4px solid #f56565; background: #fff5f5; }
  </style>
</head>
<body>
  <h1>Auto-Architect Analysis Report</h1>
  <h2>Health Score: ${healthScore.overall}/100 (Grade ${healthScore.grade})</h2>
  
  <h3>Metrics</h3>
  <div class="metric">
    <div class="metric-value">${metrics.totalModules}</div>
    <div>Modules</div>
  </div>
  <div class="metric">
    <div class="metric-value">${metrics.totalLines}</div>
    <div>Lines</div>
  </div>
  
  <h3>Issues (${antiPatterns.length})</h3>
  ${antiPatterns.map(issue => `
    <div class="issue">
      <strong>${issue.type}</strong> in ${issue.module}<br>
      ${issue.description}
    </div>
  `).join('')}
  
  <h3>Refactoring Proposals (${proposals.length})</h3>
  ${proposals.map(p => `
    <div class="issue">
      <strong>${p.type}</strong> - ${p.target.join(', ')}<br>
      ${p.description} (${p.effort}h)
    </div>
  `).join('')}
</body>
</html>`;
}

// Generate Markdown report
function generateMarkdownReport() {
  const { healthScore, metrics, antiPatterns, proposals } = analysisResults;
  
  return `# Auto-Architect Analysis Report

## Health Score: ${healthScore.overall}/100 (Grade ${healthScore.grade})

### Metrics
- Modules: ${metrics.totalModules}
- Lines of Code: ${metrics.totalLines}
- Complexity: ${metrics.cyclomaticComplexity}
- Test Coverage: ${metrics.testCoverage}%

### Issues (${antiPatterns.length})
${antiPatterns.map(issue => `- **${issue.type}** in ${issue.module}: ${issue.description}`).join('\n')}

### Refactoring Proposals (${proposals.length})
${proposals.map(p => `- **${p.type}** (${p.priority}): ${p.description} - ${p.effort}h`).join('\n')}
`;
}

// Generate CSV report
function generateCSVReport() {
  const { metrics } = analysisResults;
  
  return `Metric,Value
Total Modules,${metrics.totalModules}
Total Lines,${metrics.totalLines}
Avg Dependencies,${metrics.avgDependencies}
Cyclomatic Complexity,${metrics.cyclomaticComplexity}
Coupling,${metrics.coupling}
Cohesion,${metrics.cohesion}
Maintainability Index,${metrics.maintainabilityIndex}
Test Coverage,${metrics.testCoverage}
Technical Debt,${metrics.technicalDebt}`;
}

// Download file
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Start new analysis
function startNewAnalysis() {
  analysisResults = null;
  clearFiles();
}

// Show section
function showSection(sectionId) {
  document.querySelectorAll('.main-content > section').forEach(section => {
    section.style.display = 'none';
  });
  document.getElementById(sectionId).style.display = 'block';
}
