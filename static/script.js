document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('lookupForm');
  const queryInput = document.getElementById('queryInput');
  const resultDiv = document.getElementById('result');
  const tabs = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Initialize tabs
  tabs.forEach(tab => {
      tab.addEventListener('click', () => {
          const tabId = tab.getAttribute('data-tab');
          
          // Update active tab
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          
          // Show corresponding content
          tabContents.forEach(content => content.classList.remove('active'));
          document.getElementById(`${tabId}-tab`).classList.add('active');
      });
  });

  // Handle example clicks
  document.querySelectorAll('.example').forEach(example => {
      example.addEventListener('click', (e) => {
          e.preventDefault();
          queryInput.value = example.getAttribute('data-query');
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
          
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `API request failed with status ${response.status}`);
          }
          
          const data = await response.json();
          displayResults(data);
          
      } catch (error) {
          showError(error.message);
          console.error('Fetch error:', error);
      } finally {
          showLoading(false);
      }
  });

  function showLoading(show) {
      if (show) {
          resultDiv.innerHTML = `
              <div class="loading">
                  <div class="spinner"></div>
                  <p>Analyzing ${queryInput.value}...</p>
              </div>
          `;
      }
  }

  function showError(message) {
      document.getElementById('overview-tab').innerHTML = `
          <div class="error-card">
              <i class="fas fa-exclamation-triangle"></i>
              <h3>Error</h3>
              <p>${message}</p>
              <p>Please try a different query or check your input.</p>
          </div>
      `;
      document.querySelector('.tab-btn[data-tab="overview"]').click();
  }

  function displayResults(data) {
      // If data comes wrapped in a 'data' property, unwrap it
      const resultData = data.data || data;
      
      displayOverview(resultData);
      displayThreatData(resultData);
      displayGeoData(resultData);
      displayWhoisData(resultData);
      
      // Switch to overview tab if coming from welcome screen
      if (document.querySelector('#overview-tab .welcome-message')) {
          document.querySelector('.tab-btn[data-tab="overview"]').click();
      }
  }

  function displayOverview(data) {
      const tab = document.getElementById('overview-tab');
      
      // Calculate threat level
      const threatScore = data.threat?.abuseConfidenceScore || 0;
      let threatLevel = 'low';
      let threatColor = '#28a745';
      
      if (threatScore > 70) {
          threatLevel = 'high';
          threatColor = '#dc3545';
      } else if (threatScore > 30) {
          threatLevel = 'medium';
          threatColor = '#ffc107';
      }
      
      tab.innerHTML = `
          <div class="card">
              <h3><i class="fas fa-info-circle"></i> Overview</h3>
              <div class="info-grid">
                  <div class="info-item">
                      <strong>Target</strong>
                      <span>${data.query || data.ip || 'N/A'}</span>
                  </div>
                  <div class="info-item">
                      <strong>Location</strong>
                      <span>${data.city || 'Unknown'}, ${data.country || 'Unknown'}</span>
                  </div>
                  <div class="info-item">
                      <strong>ISP</strong>
                      <span>${data.isp || 'Unknown'}</span>
                  </div>
                  <div class="info-item">
                      <strong>Threat Score</strong>
                      <div class="threat-meter">
                          <div class="threat-bar" style="width: ${threatScore}%; background: ${threatColor}"></div>
                          <span>${threatScore}/100</span>
                      </div>
                      <span class="threat-level threat-${threatLevel}">${threatLevel.toUpperCase()}</span>
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
      const threatData = data.threat || {};
      
      tab.innerHTML = `
          <div class="card">
              <h3><i class="fas fa-shield-virus"></i> Threat Intelligence</h3>
              
              <div class="threat-stats">
                  <div class="stat-card danger">
                      <h4>Abuse Score</h4>
                      <div class="stat-value">${threatData.abuseConfidenceScore || 0}/100</div>
                  </div>
                  <div class="stat-card warning">
                      <h4>Total Reports</h4>
                      <div class="stat-value">${threatData.totalReports || 0}</div>
                  </div>
                  <div class="stat-card info">
                      <h4>Last Reported</h4>
                      <div class="stat-value">${formatDate(threatData.lastReportedAt) || 'Never'}</div>
                  </div>
              </div>
              
              ${threatData.reports && threatData.reports.length > 0 ? `
              <h3><i class="fas fa-clipboard-list"></i> Recent Reports</h3>
              <div class="reports-list">
                  ${threatData.reports.slice(0, 5).map(report => `
                      <div class="report-item">
                          <div class="report-date">${formatDate(report.reportedAt)}</div>
                          <div class="report-categories">
                              ${(report.categories || []).map(cat => `
                                  <span class="category-tag">${cat}</span>
                              `).join('')}
                          </div>
                      </div>
                  `).join('')}
              </div>
              ` : '<p>No threat reports available</p>'}
          </div>
      `;
  }

  function displayGeoData(data) {
      const tab = document.getElementById('geo-tab');
      
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
      const whoisData = data.whois || {};
      
      // Format WHOIS data for display
      let whoisContent = '';
      if (typeof whoisData === 'object') {
          whoisContent = Object.entries(whoisData)
              .map(([key, value]) => {
                  if (Array.isArray(value)) {
                      return `<strong>${key}:</strong> ${value.join(', ')}`;
                  }
                  return `<strong>${key}:</strong> ${value}`;
              })
              .join('<br>');
      } else {
          whoisContent = whoisData;
      }
      
      tab.innerHTML = `
          <div class="card">
              <h3><i class="fas fa-address-card"></i> WHOIS Data</h3>
              <div class="whois-container">
                  ${whoisContent || '<p>No WHOIS data available</p>'}
              </div>
          </div>
      `;
  }

  function formatDate(dateString) {
      if (!dateString) return null;
      try {
          const options = { year: 'numeric', month: 'short', day: 'numeric' };
          return new Date(dateString).toLocaleDateString(undefined, options);
      } catch {
          return dateString;
      }
  }
});