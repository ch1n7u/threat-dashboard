document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const form = document.getElementById('lookupForm');
  const queryInput = document.getElementById('queryInput');
  const lookupBtn = document.getElementById('lookupBtn');
  const exampleLinks = document.querySelectorAll('.example');
  
  // Tab management
  function setupTabs() {
      document.querySelectorAll('.tab-btn').forEach(btn => {
          btn.addEventListener('click', () => {
              const tabId = btn.getAttribute('data-tab');
              document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
              document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
              
              btn.classList.add('active');
              document.getElementById(`${tabId}-tab`).classList.add('active');
          });
      });
  }
  
  // Example click handlers
  exampleLinks.forEach(link => {
      link.addEventListener('click', (e) => {
          e.preventDefault();
          queryInput.value = link.getAttribute('data-query');
          form.dispatchEvent(new Event('submit'));
      });
  });
  
  // Form submission
  form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const query = queryInput.value.trim();
      
      if (!query) {
          showError('Please enter an IP or domain');
          return;
      }
      
      showLoading(true);
      
      try {
          const response = await fetch(`/api/lookup?query=${encodeURIComponent(query)}`);
          const data = await response.json();
          
          if (data.error) {
              throw new Error(data.error);
          }
          
          displayResults(data);
      } catch (error) {
          showError(error.message);
          console.error('Error:', error);
      } finally {
          showLoading(false);
      }
  });
  
  // Display functions
  function displayResults(data) {
      displayOverview(data.overview);
      displayThreatData(data.threat);
      displayGeoData(data.geoip);
      displayWhoisData(data.whois);
  }
  
  function displayOverview(data) {
      const tab = document.getElementById('overview-tab');
      if (data.error) {
          tab.innerHTML = `<div class="error-card">${data.error}</div>`;
          return;
      }
      
      const threatScore = data.abuseConfidenceScore || 0;
      const threatLevel = getThreatLevel(threatScore);
      
      tab.innerHTML = `
          <div class="card">
              <h3><i class="fas fa-info-circle"></i> Overview</h3>
              <div class="info-grid">
                  <div class="info-item">
                      <strong>Target</strong>
                      <span>${data.query || 'N/A'}</span>
                  </div>
                  <div class="info-item">
                      <strong>Location</strong>
                      <span>${data.city || 'Unknown'}, ${data.country || ''}</span>
                  </div>
                  <div class="info-item">
                      <strong>ISP</strong>
                      <span>${data.isp || 'Unknown'}</span>
                  </div>
                  <div class="info-item">
                      <strong>Threat Score</strong>
                      <div class="threat-meter">
                          <div class="threat-bar" style="width: ${threatScore}%; background: ${threatLevel.color}"></div>
                          <span>${threatScore}/100</span>
                      </div>
                      <span class="threat-level ${threatLevel.class}">${threatLevel.text}</span>
                  </div>
              </div>
              
              ${data.lat && data.lon ? `
              <h3><i class="fas fa-map-marked-alt"></i> Location Map</h3>
              <div class="map-container">
                  <iframe 
                      width="100%" 
                      height="100%" 
                      frameborder="0" 
                      src="https://maps.google.com/maps?q=${data.lat},${data.lon}&z=8&output=embed">
                  </iframe>
              </div>
              ` : ''}
          </div>
      `;
  }
  
  function displayThreatData(data) {
      const tab = document.getElementById('threat-tab');
      if (data.error) {
          tab.innerHTML = `<div class="error-card">${data.error}</div>`;
          return;
      }
      
      tab.innerHTML = `
          <div class="card">
              <h3><i class="fas fa-shield-virus"></i> Threat Intelligence</h3>
              
              <div class="threat-stats">
                  <div class="stat-card danger">
                      <h4>Abuse Score</h4>
                      <div class="stat-value">${data.abuseConfidenceScore || 0}/100</div>
                  </div>
                  <div class="stat-card warning">
                      <h4>Total Reports</h4>
                      <div class="stat-value">${data.totalReports || 0}</div>
                  </div>
                  <div class="stat-card info">
                      <h4>Last Reported</h4>
                      <div class="stat-value">${formatDate(data.lastReportedAt) || 'Never'}</div>
                  </div>
              </div>
              
              ${data.reports && data.reports.length > 0 ? `
              <h3><i class="fas fa-clipboard-list"></i> Recent Reports</h3>
              <div class="reports-list">
                  ${data.reports.slice(0, 5).map(report => `
                      <div class="report-item">
                          <div class="report-date">${formatDate(report.reportedAt)}</div>
                          <div class="report-categories">
                              ${report.categories.map(cat => `<span class="category-tag">${cat}</span>`).join('')}
                          </div>
                      </div>
                  `).join('')}
              </div>
              ` : ''}
          </div>
      `;
  }
  
  function displayGeoData(data) {
      const tab = document.getElementById('geo-tab');
      if (data.error) {
          tab.innerHTML = `<div class="error-card">${data.error}</div>`;
          return;
      }
      
      tab.innerHTML = `
          <div class="card">
              <h3><i class="fas fa-globe-americas"></i> Geolocation Data</h3>
              
              <div class="geo-grid">
                  <div class="geo-map">
                      ${data.lat && data.lon ? `
                      <div class="map-container">
                          <iframe 
                              width="100%" 
                              height="100%" 
                              frameborder="0" 
                              src="https://maps.google.com/maps?q=${data.lat},${data.lon}&z=8&output=embed">
                          </iframe>
                      </div>
                      ` : '<p>No map data available</p>'}
                  </div>
                  
                  <div class="geo-details">
                      <div class="detail-item">
                          <strong>Country</strong>
                          <span>${data.country || 'Unknown'} (${data.countryCode || ''})</span>
                      </div>
                      <div class="detail-item">
                          <strong>Region</strong>
                          <span>${data.regionName || 'Unknown'} (${data.region || ''})</span>
                      </div>
                      <div class="detail-item">
                          <strong>City</strong>
                          <span>${data.city || 'Unknown'}</span>
                      </div>
                      <div class="detail-item">
                          <strong>ZIP Code</strong>
                          <span>${data.zip || 'N/A'}</span>
                      </div>
                      <div class="detail-item">
                          <strong>Coordinates</strong>
                          <span>${data.lat || 'N/A'}, ${data.lon || 'N/A'}</span>
                      </div>
                      <div class="detail-item">
                          <strong>Timezone</strong>
                          <span>${data.timezone || 'N/A'}</span>
                      </div>
                      <div class="detail-item">
                          <strong>ISP</strong>
                          <span>${data.isp || 'Unknown'}</span>
                      </div>
                      <div class="detail-item">
                          <strong>Organization</strong>
                          <span>${data.org || 'N/A'}</span>
                      </div>
                      <div class="detail-item">
                          <strong>AS Number</strong>
                          <span>${data.as || 'N/A'}</span>
                      </div>
                  </div>
              </div>
          </div>
      `;
  }
  
  function displayWhoisData(data) {
      const tab = document.getElementById('whois-tab');
      if (data.error) {
          tab.innerHTML = `<div class="error-card">${data.error}</div>`;
          return;
      }
      
      // Format WHOIS data for display
      let whoisContent = '';
      if (typeof data === 'object') {
          whoisContent = Object.entries(data)
              .map(([key, value]) => {
                  if (Array.isArray(value)) {
                      return `<strong>${key}:</strong> ${value.join(', ')}`;
                  }
                  return `<strong>${key}:</strong> ${value}`;
              })
              .join('<br>');
      } else {
          whoisContent = data;
      }
      
      tab.innerHTML = `
          <div class="card">
              <h3><i class="fas fa-address-card"></i> WHOIS Data</h3>
              <div class="whois-container">
                  ${whoisContent}
              </div>
          </div>
      `;
  }
  
  // Helper functions
  function showLoading(show) {
      if (show) {
          lookupBtn.disabled = true;
          lookupBtn.innerHTML = '<span class="spinner"></span> Analyzing...';
      } else {
          lookupBtn.disabled = false;
          lookupBtn.innerHTML = '<i class="fas fa-search"></i> Analyze';
      }
  }
  
  function showError(message) {
      document.getElementById('overview-tab').innerHTML = `
          <div class="error-card">
              <i class="fas fa-exclamation-triangle"></i>
              <h3>Error</h3>
              <p>${message}</p>
          </div>
      `;
      document.querySelector('.tab-btn[data-tab="overview"]').click();
  }
  
  function formatDate(dateString) {
      if (!dateString) return null;
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
  }
  
  function getThreatLevel(score) {
      if (score >= 70) return { text: 'High', class: 'threat-high', color: '#dc3545' };
      if (score >= 30) return { text: 'Medium', class: 'threat-medium', color: '#ffc107' };
      return { text: 'Low', class: 'threat-low', color: '#28a745' };
  }
  
  // Initialize
  setupTabs();
});