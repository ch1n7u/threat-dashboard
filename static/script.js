document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const form = document.getElementById('lookupForm');
  const queryInput = document.getElementById('queryInput');
  const lookupBtn = document.getElementById('lookupBtn');
  const resultDiv = document.getElementById('result');
  
  // Initialize tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
          const tabId = btn.getAttribute('data-tab');
          
          // Update active tab
          document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
          btn.classList.add('active');
          
          // Show corresponding content
          document.querySelectorAll('.tab-content').forEach(content => {
              content.classList.remove('active');
          });
          document.getElementById(`${tabId}-tab`).classList.add('active');
      });
  });

  // Example click handlers
  document.querySelectorAll('.example').forEach(link => {
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
          
          if (!response.ok) {
              const error = await response.json().catch(() => ({ message: 'Unknown error' }));
              throw new Error(error.message || `HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          displayResults(data);
          
      } catch (error) {
          showError(error.message);
          console.error('Error:', error);
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
      } else {
          const loadingEl = document.querySelector('.loading');
          if (loadingEl) loadingEl.remove();
      }
  }

  function showError(message) {
      const overviewTab = document.getElementById('overview-tab');
      overviewTab.innerHTML = `
          <div class="error-card">
              <i class="fas fa-exclamation-triangle"></i>
              <h3>Error</h3>
              <p>${message}</p>
              <p>Please try again or check your input.</p>
          </div>
      `;
      document.querySelector('.tab-btn[data-tab="overview"]').click();
  }

  function displayResults(data) {
      // If data is nested under 'data' property, use that
      const resultData = data.data || data;
      
      updateTabContent('overview', createOverviewContent(resultData));
      updateTabContent('threat', createThreatContent(resultData));
      updateTabContent('geo', createGeoContent(resultData));
      updateTabContent('whois', createWhoisContent(resultData));
      
      // Switch to overview tab if coming from welcome screen
      if (document.querySelector('#overview-tab .welcome-message')) {
          document.querySelector('.tab-btn[data-tab="overview"]').click();
      }
  }

  // Now properly defined updateTabContent function
  function updateTabContent(tabId, content) {
      const tab = document.getElementById(`${tabId}-tab`);
      if (tab) {
          tab.innerHTML = content;
      } else {
          console.error(`Tab ${tabId} not found`);
      }
  }

  function createOverviewContent(data) {
      const threatScore = data.abuseConfidenceScore || 0;
      let threatClass = 'threat-low';
      let threatLevel = 'Low';
      
      if (threatScore > 70) {
          threatClass = 'threat-high';
          threatLevel = 'High';
      } else if (threatScore > 30) {
          threatClass = 'threat-medium';
          threatLevel = 'Medium';
      }
      
      return `
          <div class="card">
              <h3><i class="fas fa-info-circle"></i> Overview</h3>
              <div class="info-grid">
                  <div class="info-item">
                      <strong>Query</strong>
                      <span>${data.query || 'N/A'}</span>
                  </div>
                  ${data.status ? `
                  <div class="info-item">
                      <strong>Status</strong>
                      <span>${data.status}</span>
                  </div>
                  ` : ''}
                  ${data.country ? `
                  <div class="info-item">
                      <strong>Country</strong>
                      <span>${data.country} (${data.countryCode || ''})</span>
                  </div>
                  ` : ''}
                  ${data.city ? `
                  <div class="info-item">
                      <strong>Location</strong>
                      <span>${data.city}, ${data.regionName || ''}</span>
                  </div>
                  ` : ''}
                  <div class="info-item">
                      <strong>Threat Level</strong>
                      <span>
                          ${threatScore}/100 
                          <span class="threat-level ${threatClass}">${threatLevel}</span>
                      </span>
                  </div>
              </div>
              ${data.lat && data.lon ? `
              <h3 style="margin-top: 1.5rem;"><i class="fas fa-map-marked-alt"></i> Location</h3>
              <div class="map-container">
                  <iframe 
                      width="100%" 
                      height="100%" 
                      frameborder="0" 
                      scrolling="no" 
                      marginheight="0" 
                      marginwidth="0" 
                      src="https://maps.google.com/maps?q=${data.lat},${data.lon}&z=8&output=embed">
                  </iframe>
              </div>
              ` : ''}
          </div>
      `;
  }

  function createThreatContent(data) {
      const threatData = data.threat || data;
      return `
          <div class="card">
              <h3><i class="fas fa-shield-virus"></i> Threat Data</h3>
              ${threatData.abuseConfidenceScore ? `
              <div class="info-item">
                  <strong>Abuse Confidence Score</strong>
                  <span>${threatData.abuseConfidenceScore}/100</span>
              </div>
              ` : ''}
              ${threatData.totalReports ? `
              <div class="info-item">
                  <strong>Total Reports</strong>
                  <span>${threatData.totalReports}</span>
              </div>
              ` : ''}
              ${threatData.lastReportedAt ? `
              <div class="info-item">
                  <strong>Last Reported</strong>
                  <span>${formatDate(threatData.lastReportedAt)}</span>
              </div>
              ` : ''}
              ${threatData.reports && threatData.reports.length > 0 ? `
              <h3 style="margin-top: 1.5rem;">Recent Reports</h3>
              <div style="max-height: 300px; overflow-y: auto;">
                  ${threatData.reports.slice(0, 5).map(report => `
                      <div style="padding: 0.5rem; border-bottom: 1px solid #eee;">
                          <div><strong>Date:</strong> ${formatDate(report.reportedAt)}</div>
                          <div><strong>Categories:</strong> ${report.categories?.join(', ') || 'None'}</div>
                      </div>
                  `).join('')}
              </div>
              ` : '<p>No threat reports available</p>'}
          </div>
      `;
  }

  function createGeoContent(data) {
      return `
          <div class="card">
              <h3><i class="fas fa-globe-americas"></i> GeoIP Data</h3>
              <div class="info-grid">
                  ${data.country ? `
                  <div class="info-item">
                      <strong>Country</strong>
                      <span>${data.country} (${data.countryCode || ''})</span>
                  </div>
                  ` : ''}
                  ${data.regionName ? `
                  <div class="info-item">
                      <strong>Region</strong>
                      <span>${data.regionName} (${data.region || ''})</span>
                  </div>
                  ` : ''}
                  ${data.city ? `
                  <div class="info-item">
                      <strong>City</strong>
                      <span>${data.city}</span>
                  </div>
                  ` : ''}
                  ${data.zip ? `
                  <div class="info-item">
                      <strong>ZIP Code</strong>
                      <span>${data.zip}</span>
                  </div>
                  ` : ''}
                  ${data.lat && data.lon ? `
                  <div class="info-item">
                      <strong>Coordinates</strong>
                      <span>${data.lat}, ${data.lon}</span>
                  </div>
                  ` : ''}
                  ${data.timezone ? `
                  <div class="info-item">
                      <strong>Timezone</strong>
                      <span>${data.timezone}</span>
                  </div>
                  ` : ''}
                  ${data.isp ? `
                  <div class="info-item">
                      <strong>ISP</strong>
                      <span>${data.isp}</span>
                  </div>
                  ` : ''}
                  ${data.org ? `
                  <div class="info-item">
                      <strong>Organization</strong>
                      <span>${data.org}</span>
                  </div>
                  ` : ''}
                  ${data.as ? `
                  <div class="info-item">
                      <strong>AS Number</strong>
                      <span>${data.as}</span>
                  </div>
                  ` : ''}
              </div>
              ${data.lat && data.lon ? `
              <h3 style="margin-top: 1.5rem;"><i class="fas fa-map-marked-alt"></i> Map</h3>
              <div class="map-container">
                  <iframe 
                      width="100%" 
                      height="100%" 
                      frameborder="0" 
                      scrolling="no" 
                      marginheight="0" 
                      marginwidth="0" 
                      src="https://maps.google.com/maps?q=${data.lat},${data.lon}&z=8&output=embed">
                  </iframe>
              </div>
              ` : ''}
          </div>
      `;
  }

  function createWhoisContent(data) {
      const whoisData = data.whois || {};
      let whoisContent = 'No WHOIS data available';
      
      if (typeof whoisData === 'object' && Object.keys(whoisData).length > 0) {
          whoisContent = Object.entries(whoisData)
              .map(([key, value]) => {
                  if (Array.isArray(value)) {
                      return `<strong>${key}:</strong> ${value.join(', ')}`;
                  }
                  return `<strong>${key}:</strong> ${value}`;
              })
              .join('<br>');
      } else if (typeof whoisData === 'string') {
          whoisContent = whoisData;
      }
      
      return `
          <div class="card">
              <h3><i class="fas fa-address-card"></i> WHOIS Data</h3>
              <div class="whois-container">
                  ${whoisContent}
              </div>
          </div>
      `;
  }

  function formatDate(dateString) {
      if (!dateString) return 'Unknown';
      try {
          const date = new Date(dateString);
          return date.toLocaleString();
      } catch (e) {
          return dateString;
      }
  }
});