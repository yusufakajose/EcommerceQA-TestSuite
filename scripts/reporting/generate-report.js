/**
 * Comprehensive Report Generator
 * Generates detailed test execution reports with screenshots and videos
 */

const fs = require('fs');
const path = require('path');

class ReportGenerator {
  constructor() {
    this.reportDir = './reports';
    this.testResultsDir = './test-results';
    this.outputDir = './reports/comprehensive';
    
    this.ensureDirectories();
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    const dirs = [this.reportDir, this.outputDir];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Generate comprehensive report
   */
  async generateReport() {
    console.log('Generating comprehensive test report...');
    
    try {
      // Load test results
      const results = await this.loadTestResults();
      
      // Collect media files
      const mediaFiles = await this.collectMediaFiles();
      
      // Generate main report
      await this.generateMainReport(results, mediaFiles);
      
      // Generate detailed test reports
      await this.generateDetailedReports(results, mediaFiles);
      
      // Generate media gallery
      await this.generateMediaGallery(mediaFiles);
      
      // Generate summary dashboard
      await this.generateSummaryDashboard(results);
      
      console.log('Comprehensive report generated successfully');
      
    } catch (error) {
      console.error('Failed to generate comprehensive report:', error);
      throw error;
    }
  }

  /**
   * Load test results from JSON file
   * @returns {Object} - Test results
   */
  async loadTestResults() {
    const resultsPath = path.join(this.reportDir, 'test-results.json');
    
    if (!fs.existsSync(resultsPath)) {
      throw new Error('Test results file not found');
    }
    
    return JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  }

  /**
   * Collect media files (screenshots, videos, traces)
   * @returns {Object} - Organized media files
   */
  async collectMediaFiles() {
    const mediaFiles = {
      screenshots: [],
      videos: [],
      traces: [],
      attachments: []
    };
    
    if (!fs.existsSync(this.testResultsDir)) {
      return mediaFiles;
    }
    
    // Recursively find media files
    this.findMediaFiles(this.testResultsDir, mediaFiles);
    
    console.log(`Found ${mediaFiles.screenshots.length} screenshots, ${mediaFiles.videos.length} videos, ${mediaFiles.traces.length} traces`);
    
    return mediaFiles;
  }

  /**
   * Recursively find media files
   * @param {string} dir - Directory to search
   * @param {Object} mediaFiles - Media files collection
   */
  findMediaFiles(dir, mediaFiles) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        this.findMediaFiles(itemPath, mediaFiles);
      } else {
        const ext = path.extname(item).toLowerCase();
        const relativePath = path.relative(this.testResultsDir, itemPath);
        
        const fileInfo = {
          name: item,
          path: itemPath,
          relativePath: relativePath,
          size: stat.size,
          modified: stat.mtime,
          environment: this.extractEnvironmentFromPath(itemPath),
          browser: this.extractBrowserFromPath(itemPath),
          testName: this.extractTestNameFromPath(itemPath)
        };
        
        switch (ext) {
          case '.png':
          case '.jpg':
          case '.jpeg':
            mediaFiles.screenshots.push(fileInfo);
            break;
          case '.webm':
          case '.mp4':
            mediaFiles.videos.push(fileInfo);
            break;
          case '.zip':
            if (item.includes('trace')) {
              mediaFiles.traces.push(fileInfo);
            } else {
              mediaFiles.attachments.push(fileInfo);
            }
            break;
          default:
            if (item.includes('attachment')) {
              mediaFiles.attachments.push(fileInfo);
            }
        }
      }
    }
  }

  /**
   * Extract environment from file path
   * @param {string} filePath - File path
   * @returns {string} - Environment name
   */
  extractEnvironmentFromPath(filePath) {
    const environments = ['development', 'staging', 'production'];
    
    for (const env of environments) {
      if (filePath.includes(env)) {
        return env;
      }
    }
    
    return 'unknown';
  }

  /**
   * Extract browser from file path
   * @param {string} filePath - File path
   * @returns {string} - Browser name
   */
  extractBrowserFromPath(filePath) {
    const browsers = ['chromium', 'firefox', 'webkit', 'chrome', 'safari', 'edge'];
    
    for (const browser of browsers) {
      if (filePath.includes(browser)) {
        return browser;
      }
    }
    
    return 'unknown';
  }

  /**
   * Extract test name from file path
   * @param {string} filePath - File path
   * @returns {string} - Test name
   */
  extractTestNameFromPath(filePath) {
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // Remove common prefixes/suffixes
    return fileName
      .replace(/^test-/, '')
      .replace(/-\d+$/, '')
      .replace(/-(screenshot|video|trace)$/, '')
      .replace(/-failed$/, '')
      .replace(/-\d{4}-\d{2}-\d{2}.*/, '');
  }

  /**
   * Generate main comprehensive report
   * @param {Object} results - Test results
   * @param {Object} mediaFiles - Media files
   */
  async generateMainReport(results, mediaFiles) {
    const reportPath = path.join(this.outputDir, 'index.html');
    const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Test Report</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; }
        .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .header p { opacity: 0.9; font-size: 1.1rem; }
        .nav { background: white; padding: 1rem 2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .nav ul { list-style: none; display: flex; gap: 2rem; }
        .nav a { text-decoration: none; color: #495057; font-weight: 500; padding: 0.5rem 1rem; border-radius: 6px; transition: all 0.3s; }
        .nav a:hover, .nav a.active { background: #007bff; color: white; }
        .container { max-width: 1200px; margin: 2rem auto; padding: 0 2rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin-bottom: 3rem; }
        .card { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.3s; }
        .card:hover { transform: translateY(-2px); }
        .card h3 { color: #495057; margin-bottom: 1rem; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
        .card .value { font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem; }
        .card .change { font-size: 0.9rem; opacity: 0.7; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .total { color: #007bff; }
        .section { background: white; border-radius: 12px; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .section h2 { color: #495057; margin-bottom: 1.5rem; padding-bottom: 0.5rem; border-bottom: 3px solid #007bff; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background: #f8f9fa; font-weight: 600; color: #495057; }
        tr:hover { background: #f8f9fa; }
        .badge { padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.8rem; font-weight: 600; }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-danger { background: #f8d7da; color: #721c24; }
        .badge-warning { background: #fff3cd; color: #856404; }
        .progress { width: 100%; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden; }
        .progress-bar { height: 100%; background: #28a745; transition: width 0.3s; }
        .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
        .media-item { position: relative; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .media-item img { width: 100%; height: 150px; object-fit: cover; }
        .media-item video { width: 100%; height: 150px; }
        .media-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); color: white; padding: 1rem 0.5rem 0.5rem; font-size: 0.8rem; }
        .chart-container { height: 300px; margin: 1rem 0; }
        .tabs { display: flex; border-bottom: 2px solid #dee2e6; margin-bottom: 2rem; }
        .tab { padding: 1rem 2rem; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s; }
        .tab.active { border-bottom-color: #007bff; color: #007bff; font-weight: 600; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .footer { text-align: center; padding: 2rem; color: #6c757d; }
    </style>
</head>
<body>
    <div class="header">
        <h1><i class="fas fa-chart-line"></i> Comprehensive Test Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
    
    <nav class="nav">
        <ul>
            <li><a href="#overview" class="active"><i class="fas fa-tachometer-alt"></i> Overview</a></li>
            <li><a href="#environments"><i class="fas fa-server"></i> Environments</a></li>
            <li><a href="#browsers"><i class="fas fa-globe"></i> Browsers</a></li>
            <li><a href="#suites"><i class="fas fa-list"></i> Test Suites</a></li>
            <li><a href="#media"><i class="fas fa-images"></i> Media</a></li>
            <li><a href="#trends"><i class="fas fa-chart-area"></i> Trends</a></li>
        </ul>
    </nav>
    
    <div class="container">
        <div id="overview" class="tab-content active">
            <div class="grid">
                <div class="card">
                    <h3><i class="fas fa-list-ol"></i> Total Tests</h3>
                    <div class="value total">${results.total}</div>
                    <div class="change">Across all environments</div>
                </div>
                <div class="card">
                    <h3><i class="fas fa-check-circle"></i> Passed</h3>
                    <div class="value passed">${results.passed}</div>
                    <div class="change">${passRate}% pass rate</div>
                </div>
                <div class="card">
                    <h3><i class="fas fa-times-circle"></i> Failed</h3>
                    <div class="value failed">${results.failed}</div>
                    <div class="change">${results.failed > 0 ? 'Requires attention' : 'No failures'}</div>
                </div>
                <div class="card">
                    <h3><i class="fas fa-forward"></i> Skipped</h3>
                    <div class="value skipped">${results.skipped}</div>
                    <div class="change">Not executed</div>
                </div>
            </div>
            
            <div class="section">
                <h2><i class="fas fa-chart-pie"></i> Test Distribution</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <div>
                        <h4>Pass Rate Progress</h4>
                        <div class="progress">
                            <div class="progress-bar" style="width: ${passRate}%"></div>
                        </div>
                        <p style="margin-top: 0.5rem; color: #6c757d;">${passRate}% of tests passed</p>
                    </div>
                    <div>
                        <h4>Media Files Collected</h4>
                        <ul style="list-style: none; padding: 0;">
                            <li><i class="fas fa-image"></i> ${mediaFiles.screenshots.length} Screenshots</li>
                            <li><i class="fas fa-video"></i> ${mediaFiles.videos.length} Videos</li>
                            <li><i class="fas fa-file-archive"></i> ${mediaFiles.traces.length} Traces</li>
                            <li><i class="fas fa-paperclip"></i> ${mediaFiles.attachments.length} Attachments</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="environments" class="tab-content">
            <div class="section">
                <h2><i class="fas fa-server"></i> Environment Results</h2>
                ${this.generateEnvironmentTable(results)}
            </div>
        </div>
        
        <div id="browsers" class="tab-content">
            <div class="section">
                <h2><i class="fas fa-globe"></i> Browser Results</h2>
                ${this.generateBrowserTable(results)}
            </div>
        </div>
        
        <div id="suites" class="tab-content">
            <div class="section">
                <h2><i class="fas fa-list"></i> Test Suite Results</h2>
                ${this.generateSuiteTable(results)}
            </div>
        </div>
        
        <div id="media" class="tab-content">
            <div class="section">
                <h2><i class="fas fa-images"></i> Screenshots</h2>
                ${this.generateMediaGallery(mediaFiles.screenshots, 'screenshot')}
            </div>
            
            <div class="section">
                <h2><i class="fas fa-video"></i> Videos</h2>
                ${this.generateMediaGallery(mediaFiles.videos, 'video')}
            </div>
            
            <div class="section">
                <h2><i class="fas fa-file-archive"></i> Traces & Attachments</h2>
                ${this.generateAttachmentsList(mediaFiles.traces.concat(mediaFiles.attachments))}
            </div>
        </div>
        
        <div id="trends" class="tab-content">
            <div class="section">
                <h2><i class="fas fa-chart-area"></i> Trend Analysis</h2>
                <p>Trend analysis will be displayed here when historical data is available.</p>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <p>Generated by QA Testing Framework • ${new Date().toISOString()}</p>
    </div>
    
    <script>
        // Tab navigation
        document.querySelectorAll('.nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.getAttribute('href').substring(1);
                
                // Update active nav
                document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));
                e.target.classList.add('active');
                
                // Update active content
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                document.getElementById(target).classList.add('active');
            });
        });
        
        // Media lightbox
        document.querySelectorAll('.media-item img, .media-item video').forEach(media => {
            media.addEventListener('click', () => {
                // Simple lightbox implementation
                const overlay = document.createElement('div');
                overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 1000; display: flex; align-items: center; justify-content: center; cursor: pointer;';
                
                const clone = media.cloneNode();
                clone.style.cssText = 'max-width: 90%; max-height: 90%; border-radius: 8px;';
                
                overlay.appendChild(clone);
                document.body.appendChild(overlay);
                
                overlay.addEventListener('click', () => {
                    document.body.removeChild(overlay);
                });
            });
        });
    </script>
</body>
</html>`;
    
    fs.writeFileSync(reportPath, html);
    console.log(`Main report saved: ${reportPath}`);
  }

  /**
   * Generate environment results table
   * @param {Object} results - Test results
   * @returns {string} - HTML table
   */
  generateEnvironmentTable(results) {
    if (Object.keys(results.environments).length === 0) {
      return '<p>No environment data available.</p>';
    }
    
    let html = '<table><thead><tr><th>Environment</th><th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Pass Rate</th><th>Status</th></tr></thead><tbody>';
    
    Object.entries(results.environments).forEach(([env, stats]) => {
      const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
      const status = stats.failed === 0 ? 'success' : stats.failed > stats.total * 0.1 ? 'danger' : 'warning';
      const statusText = stats.failed === 0 ? 'Passing' : stats.failed > stats.total * 0.1 ? 'Critical' : 'Warning';
      
      html += `<tr>
        <td><strong>${env}</strong></td>
        <td>${stats.total}</td>
        <td>${stats.passed}</td>
        <td>${stats.failed}</td>
        <td>${stats.skipped}</td>
        <td>${passRate}%</td>
        <td><span class="badge badge-${status}">${statusText}</span></td>
      </tr>`;
    });
    
    html += '</tbody></table>';
    return html;
  }

  /**
   * Generate browser results table
   * @param {Object} results - Test results
   * @returns {string} - HTML table
   */
  generateBrowserTable(results) {
    if (Object.keys(results.browsers).length === 0) {
      return '<p>No browser data available.</p>';
    }
    
    let html = '<table><thead><tr><th>Browser</th><th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Pass Rate</th><th>Status</th></tr></thead><tbody>';
    
    Object.entries(results.browsers).forEach(([browser, stats]) => {
      const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
      const status = stats.failed === 0 ? 'success' : stats.failed > stats.total * 0.1 ? 'danger' : 'warning';
      const statusText = stats.failed === 0 ? 'Passing' : stats.failed > stats.total * 0.1 ? 'Critical' : 'Warning';
      
      html += `<tr>
        <td><strong>${browser}</strong></td>
        <td>${stats.total}</td>
        <td>${stats.passed}</td>
        <td>${stats.failed}</td>
        <td>${stats.skipped}</td>
        <td>${passRate}%</td>
        <td><span class="badge badge-${status}">${statusText}</span></td>
      </tr>`;
    });
    
    html += '</tbody></table>';
    return html;
  }

  /**
   * Generate test suite results table
   * @param {Object} results - Test results
   * @returns {string} - HTML table
   */
  generateSuiteTable(results) {
    if (Object.keys(results.suites).length === 0) {
      return '<p>No test suite data available.</p>';
    }
    
    let html = '<table><thead><tr><th>Test Suite</th><th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Pass Rate</th><th>Status</th></tr></thead><tbody>';
    
    Object.entries(results.suites).forEach(([suite, stats]) => {
      const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
      const status = stats.failed === 0 ? 'success' : stats.failed > stats.total * 0.1 ? 'danger' : 'warning';
      const statusText = stats.failed === 0 ? 'Passing' : stats.failed > stats.total * 0.1 ? 'Critical' : 'Warning';
      
      html += `<tr>
        <td><strong>${suite}</strong></td>
        <td>${stats.total}</td>
        <td>${stats.passed}</td>
        <td>${stats.failed}</td>
        <td>${stats.skipped}</td>
        <td>${passRate}%</td>
        <td><span class="badge badge-${status}">${statusText}</span></td>
      </tr>`;
    });
    
    html += '</tbody></table>';
    return html;
  }

  /**
   * Generate media gallery
   * @param {Array} mediaFiles - Media files
   * @param {string} type - Media type
   * @returns {string} - HTML gallery
   */
  generateMediaGallery(mediaFiles, type) {
    if (mediaFiles.length === 0) {
      return `<p>No ${type}s available.</p>`;
    }
    
    let html = '<div class="media-grid">';
    
    mediaFiles.forEach(file => {
      const relativePath = path.relative(process.cwd(), file.path);
      
      if (type === 'screenshot') {
        html += `
          <div class="media-item">
            <img src="../${relativePath}" alt="${file.testName}" loading="lazy">
            <div class="media-overlay">
              <div><strong>${file.testName}</strong></div>
              <div>${file.environment} • ${file.browser}</div>
            </div>
          </div>`;
      } else if (type === 'video') {
        html += `
          <div class="media-item">
            <video controls>
              <source src="../${relativePath}" type="video/webm">
              Your browser does not support the video tag.
            </video>
            <div class="media-overlay">
              <div><strong>${file.testName}</strong></div>
              <div>${file.environment} • ${file.browser}</div>
            </div>
          </div>`;
      }
    });
    
    html += '</div>';
    return html;
  }

  /**
   * Generate attachments list
   * @param {Array} attachments - Attachment files
   * @returns {string} - HTML list
   */
  generateAttachmentsList(attachments) {
    if (attachments.length === 0) {
      return '<p>No traces or attachments available.</p>';
    }
    
    let html = '<table><thead><tr><th>File</th><th>Test</th><th>Environment</th><th>Browser</th><th>Size</th><th>Modified</th><th>Download</th></tr></thead><tbody>';
    
    attachments.forEach(file => {
      const relativePath = path.relative(process.cwd(), file.path);
      const sizeKB = (file.size / 1024).toFixed(1);
      
      html += `<tr>
        <td><strong>${file.name}</strong></td>
        <td>${file.testName}</td>
        <td>${file.environment}</td>
        <td>${file.browser}</td>
        <td>${sizeKB} KB</td>
        <td>${file.modified.toLocaleString()}</td>
        <td><a href="../${relativePath}" download><i class="fas fa-download"></i> Download</a></td>
      </tr>`;
    });
    
    html += '</tbody></table>';
    return html;
  }

  /**
   * Generate detailed test reports
   * @param {Object} results - Test results
   * @param {Object} mediaFiles - Media files
   */
  async generateDetailedReports(results, mediaFiles) {
    // Generate individual environment reports
    for (const [environment, stats] of Object.entries(results.environments)) {
      await this.generateEnvironmentReport(environment, stats, mediaFiles);
    }
    
    // Generate individual browser reports
    for (const [browser, stats] of Object.entries(results.browsers)) {
      await this.generateBrowserReport(browser, stats, mediaFiles);
    }
  }

  /**
   * Generate environment-specific report
   * @param {string} environment - Environment name
   * @param {Object} stats - Environment statistics
   * @param {Object} mediaFiles - Media files
   */
  async generateEnvironmentReport(environment, stats, mediaFiles) {
    const reportPath = path.join(this.outputDir, `environment-${environment}.html`);
    const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
    
    // Filter media files for this environment
    const envMedia = {
      screenshots: mediaFiles.screenshots.filter(f => f.environment === environment),
      videos: mediaFiles.videos.filter(f => f.environment === environment),
      traces: mediaFiles.traces.filter(f => f.environment === environment)
    };
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${environment} Environment Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #007bff; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat h3 { margin: 0 0 10px 0; color: #666; font-size: 14px; }
        .stat .value { font-size: 2em; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #495057; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
        .media-item { border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .media-item img, .media-item video { width: 100%; height: 150px; object-fit: cover; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${environment} Environment Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="stats">
            <div class="stat">
                <h3>Total Tests</h3>
                <div class="value">${stats.total}</div>
            </div>
            <div class="stat">
                <h3>Passed</h3>
                <div class="value passed">${stats.passed}</div>
            </div>
            <div class="stat">
                <h3>Failed</h3>
                <div class="value failed">${stats.failed}</div>
            </div>
            <div class="stat">
                <h3>Pass Rate</h3>
                <div class="value">${passRate}%</div>
            </div>
        </div>
        
        <div class="section">
            <h2>Browser Results</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 10px; text-align: left;">Browser</th>
                        <th style="padding: 10px; text-align: left;">Passed</th>
                        <th style="padding: 10px; text-align: left;">Failed</th>
                        <th style="padding: 10px; text-align: left;">Pass Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(stats.browsers).map(([browser, browserStats]) => {
                      const browserPassRate = browserStats.total > 0 ? ((browserStats.passed / browserStats.total) * 100).toFixed(1) : 0;
                      return `<tr>
                        <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${browser}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #28a745;">${browserStats.passed}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #dc3545;">${browserStats.failed}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${browserPassRate}%</td>
                      </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        ${envMedia.screenshots.length > 0 ? `
        <div class="section">
            <h2>Screenshots (${envMedia.screenshots.length})</h2>
            <div class="media-grid">
                ${envMedia.screenshots.map(file => {
                  const relativePath = path.relative(this.outputDir, file.path);
                  return `<div class="media-item"><img src="${relativePath}" alt="${file.testName}"></div>`;
                }).join('')}
            </div>
        </div>` : ''}
        
        ${envMedia.videos.length > 0 ? `
        <div class="section">
            <h2>Videos (${envMedia.videos.length})</h2>
            <div class="media-grid">
                ${envMedia.videos.map(file => {
                  const relativePath = path.relative(this.outputDir, file.path);
                  return `<div class="media-item"><video controls><source src="${relativePath}" type="video/webm"></video></div>`;
                }).join('')}
            </div>
        </div>` : ''}
    </div>
</body>
</html>`;
    
    fs.writeFileSync(reportPath, html);
    console.log(`Environment report saved: ${reportPath}`);
  }

  /**
   * Generate browser-specific report
   * @param {string} browser - Browser name
   * @param {Object} stats - Browser statistics
   * @param {Object} mediaFiles - Media files
   */
  async generateBrowserReport(browser, stats, mediaFiles) {
    const reportPath = path.join(this.outputDir, `browser-${browser}.html`);
    const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
    
    // Filter media files for this browser
    const browserMedia = {
      screenshots: mediaFiles.screenshots.filter(f => f.browser === browser),
      videos: mediaFiles.videos.filter(f => f.browser === browser),
      traces: mediaFiles.traces.filter(f => f.browser === browser)
    };
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${browser} Browser Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #007bff; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat h3 { margin: 0 0 10px 0; color: #666; font-size: 14px; }
        .stat .value { font-size: 2em; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #495057; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
        .media-item { border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .media-item img, .media-item video { width: 100%; height: 150px; object-fit: cover; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${browser} Browser Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="stats">
            <div class="stat">
                <h3>Total Tests</h3>
                <div class="value">${stats.total}</div>
            </div>
            <div class="stat">
                <h3>Passed</h3>
                <div class="value passed">${stats.passed}</div>
            </div>
            <div class="stat">
                <h3>Failed</h3>
                <div class="value failed">${stats.failed}</div>
            </div>
            <div class="stat">
                <h3>Pass Rate</h3>
                <div class="value">${passRate}%</div>
            </div>
        </div>
        
        <div class="section">
            <h2>Environment Results</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 10px; text-align: left;">Environment</th>
                        <th style="padding: 10px; text-align: left;">Passed</th>
                        <th style="padding: 10px; text-align: left;">Failed</th>
                        <th style="padding: 10px; text-align: left;">Pass Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(stats.environments).map(([env, envStats]) => {
                      const envPassRate = envStats.total > 0 ? ((envStats.passed / envStats.total) * 100).toFixed(1) : 0;
                      return `<tr>
                        <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${env}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #28a745;">${envStats.passed}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #dc3545;">${envStats.failed}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${envPassRate}%</td>
                      </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        ${browserMedia.screenshots.length > 0 ? `
        <div class="section">
            <h2>Screenshots (${browserMedia.screenshots.length})</h2>
            <div class="media-grid">
                ${browserMedia.screenshots.map(file => {
                  const relativePath = path.relative(this.outputDir, file.path);
                  return `<div class="media-item"><img src="${relativePath}" alt="${file.testName}"></div>`;
                }).join('')}
            </div>
        </div>` : ''}
        
        ${browserMedia.videos.length > 0 ? `
        <div class="section">
            <h2>Videos (${browserMedia.videos.length})</h2>
            <div class="media-grid">
                ${browserMedia.videos.map(file => {
                  const relativePath = path.relative(this.outputDir, file.path);
                  return `<div class="media-item"><video controls><source src="${relativePath}" type="video/webm"></video></div>`;
                }).join('')}
            </div>
        </div>` : ''}
    </div>
</body>
</html>`;
    
    fs.writeFileSync(reportPath, html);
    console.log(`Browser report saved: ${reportPath}`);
  }

  /**
   * Generate media gallery page
   * @param {Object} mediaFiles - Media files
   */
  async generateMediaGallery(mediaFiles) {
    const galleryPath = path.join(this.outputDir, 'media-gallery.html');
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Media Gallery</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; background: #f5f7fa; }
        .header { background: #343a40; color: white; padding: 2rem; text-align: center; }
        .container { max-width: 1400px; margin: 2rem auto; padding: 0 2rem; }
        .section { margin-bottom: 3rem; }
        .section h2 { color: #495057; border-bottom: 3px solid #007bff; padding-bottom: 1rem; margin-bottom: 2rem; }
        .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; }
        .media-item { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.3s; }
        .media-item:hover { transform: translateY(-4px); }
        .media-item img, .media-item video { width: 100%; height: 200px; object-fit: cover; }
        .media-info { padding: 1rem; }
        .media-info h4 { margin: 0 0 0.5rem 0; color: #495057; }
        .media-info p { margin: 0; color: #6c757d; font-size: 0.9rem; }
        .filter-bar { background: white; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .filter-bar select, .filter-bar input { margin: 0 0.5rem; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Media Gallery</h1>
        <p>Screenshots, videos, and traces from test execution</p>
    </div>
    
    <div class="container">
        <div class="filter-bar">
            <label>Filter by Environment:</label>
            <select id="envFilter">
                <option value="">All Environments</option>
                ${[...new Set([...mediaFiles.screenshots, ...mediaFiles.videos].map(f => f.environment))].map(env => 
                  `<option value="${env}">${env}</option>`
                ).join('')}
            </select>
            
            <label>Filter by Browser:</label>
            <select id="browserFilter">
                <option value="">All Browsers</option>
                ${[...new Set([...mediaFiles.screenshots, ...mediaFiles.videos].map(f => f.browser))].map(browser => 
                  `<option value="${browser}">${browser}</option>`
                ).join('')}
            </select>
            
            <label>Search:</label>
            <input type="text" id="searchFilter" placeholder="Search by test name...">
        </div>
        
        <div class="section">
            <h2>Screenshots (${mediaFiles.screenshots.length})</h2>
            <div class="media-grid" id="screenshotGrid">
                ${mediaFiles.screenshots.map(file => {
                  const relativePath = path.relative(this.outputDir, file.path);
                  return `
                    <div class="media-item" data-env="${file.environment}" data-browser="${file.browser}" data-test="${file.testName}">
                        <img src="${relativePath}" alt="${file.testName}" loading="lazy">
                        <div class="media-info">
                            <h4>${file.testName}</h4>
                            <p>${file.environment} • ${file.browser}</p>
                            <p>${file.modified.toLocaleString()}</p>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>
        
        <div class="section">
            <h2>Videos (${mediaFiles.videos.length})</h2>
            <div class="media-grid" id="videoGrid">
                ${mediaFiles.videos.map(file => {
                  const relativePath = path.relative(this.outputDir, file.path);
                  return `
                    <div class="media-item" data-env="${file.environment}" data-browser="${file.browser}" data-test="${file.testName}">
                        <video controls>
                            <source src="${relativePath}" type="video/webm">
                        </video>
                        <div class="media-info">
                            <h4>${file.testName}</h4>
                            <p>${file.environment} • ${file.browser}</p>
                            <p>${file.modified.toLocaleString()}</p>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>
    </div>
    
    <script>
        // Filter functionality
        const envFilter = document.getElementById('envFilter');
        const browserFilter = document.getElementById('browserFilter');
        const searchFilter = document.getElementById('searchFilter');
        
        function applyFilters() {
            const envValue = envFilter.value;
            const browserValue = browserFilter.value;
            const searchValue = searchFilter.value.toLowerCase();
            
            document.querySelectorAll('.media-item').forEach(item => {
                const env = item.dataset.env;
                const browser = item.dataset.browser;
                const test = item.dataset.test.toLowerCase();
                
                const envMatch = !envValue || env === envValue;
                const browserMatch = !browserValue || browser === browserValue;
                const searchMatch = !searchValue || test.includes(searchValue);
                
                item.style.display = envMatch && browserMatch && searchMatch ? 'block' : 'none';
            });
        }
        
        envFilter.addEventListener('change', applyFilters);
        browserFilter.addEventListener('change', applyFilters);
        searchFilter.addEventListener('input', applyFilters);
    </script>
</body>
</html>`;
    
    fs.writeFileSync(galleryPath, html);
    console.log(`Media gallery saved: ${galleryPath}`);
  }

  /**
   * Generate summary dashboard
   * @param {Object} results - Test results
   */
  async generateSummaryDashboard(results) {
    const dashboardPath = path.join(this.outputDir, 'dashboard.html');
    const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; background: #f8f9fa; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; }
        .container { max-width: 1400px; margin: 2rem auto; padding: 0 2rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .card { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .card h3 { margin: 0 0 1rem 0; color: #495057; }
        .chart-container { position: relative; height: 300px; }
        .metric { text-align: center; padding: 1rem; }
        .metric .value { font-size: 3rem; font-weight: bold; margin-bottom: 0.5rem; }
        .metric .label { color: #6c757d; text-transform: uppercase; font-size: 0.9rem; letter-spacing: 1px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Execution Dashboard</h1>
        <p>Real-time insights into test performance</p>
    </div>
    
    <div class="container">
        <div class="grid">
            <div class="card">
                <h3>Overall Results</h3>
                <div class="chart-container">
                    <canvas id="overallChart"></canvas>
                </div>
            </div>
            
            <div class="card">
                <h3>Environment Comparison</h3>
                <div class="chart-container">
                    <canvas id="environmentChart"></canvas>
                </div>
            </div>
            
            <div class="card">
                <h3>Browser Comparison</h3>
                <div class="chart-container">
                    <canvas id="browserChart"></canvas>
                </div>
            </div>
            
            <div class="card">
                <h3>Key Metrics</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="metric">
                        <div class="value passed">${results.passed}</div>
                        <div class="label">Passed</div>
                    </div>
                    <div class="metric">
                        <div class="value failed">${results.failed}</div>
                        <div class="label">Failed</div>
                    </div>
                    <div class="metric">
                        <div class="value">${passRate}%</div>
                        <div class="label">Pass Rate</div>
                    </div>
                    <div class="metric">
                        <div class="value">${Object.keys(results.environments).length}</div>
                        <div class="label">Environments</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Overall results pie chart
        const overallCtx = document.getElementById('overallChart').getContext('2d');
        new Chart(overallCtx, {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed', 'Skipped'],
                datasets: [{
                    data: [${results.passed}, ${results.failed}, ${results.skipped}],
                    backgroundColor: ['#28a745', '#dc3545', '#ffc107']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
        
        // Environment comparison chart
        const environmentCtx = document.getElementById('environmentChart').getContext('2d');
        new Chart(environmentCtx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(Object.keys(results.environments))},
                datasets: [
                    {
                        label: 'Passed',
                        data: ${JSON.stringify(Object.values(results.environments).map(env => env.passed))},
                        backgroundColor: '#28a745'
                    },
                    {
                        label: 'Failed',
                        data: ${JSON.stringify(Object.values(results.environments).map(env => env.failed))},
                        backgroundColor: '#dc3545'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true
                    }
                }
            }
        });
        
        // Browser comparison chart
        const browserCtx = document.getElementById('browserChart').getContext('2d');
        new Chart(browserCtx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(Object.keys(results.browsers))},
                datasets: [
                    {
                        label: 'Passed',
                        data: ${JSON.stringify(Object.values(results.browsers).map(browser => browser.passed))},
                        backgroundColor: '#28a745'
                    },
                    {
                        label: 'Failed',
                        data: ${JSON.stringify(Object.values(results.browsers).map(browser => browser.failed))},
                        backgroundColor: '#dc3545'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true
                    }
                }
            }
        });
    </script>
</body>
</html>`;
    
    fs.writeFileSync(dashboardPath, html);
    console.log(`Dashboard saved: ${dashboardPath}`);
  }
}

// Run report generation if called directly
if (require.main === module) {
  const generator = new ReportGenerator();
  generator.generateReport().catch(error => {
    console.error('Report generation failed:', error);
    process.exit(1);
  });
}

module.exports = ReportGenerator;