document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('lookupForm');
  const queryInput = document.getElementById('queryInput');
  const resultDiv = document.getElementById('result');

  // Initialize tabs
  function setupTabs() {
      document.querySelectorAll('.tab-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              // Remove active class from all tabs
              document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
              
              // Add active class to clicked tab
              this.classList.add('active');
              
              // Hide all tab contents
              document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
              
              // Show corresponding content
              const tabId = this.getAttribute('data-tab');
              document.getElementById(`${tabId}-tab`).classList.add('active');
          });
      });
  }

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
          
          // Debugging: Log raw response
          const responseText = await response.text();
          console.log('Raw API response:', responseText);
          
          if (!response.ok) {
              throw new Error(`API request failed with status ${response.status}`);
          }

          const data = JSON.parse(responseText);
          console.log('Parsed data:', data);
          
          if (!data) {
              throw new Error('Empty response from server');
          }

          displayResults(data);
          
      } catch (error) {
          console.error('Error:', error);
          showError(error.message);
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
              <p>Please try again or check console for details.</p>
          </div>
      `;
      document.querySelector('.tab-btn[data-tab="overview"]').click();
  }

  function displayResults(data) {
      console.log('Displaying results:', data);
      
      // Handle both direct data and nested 'data' property
      const resultData = data.data || data;
      
      // Update each tab
      updateTab('overview', createOverviewContent(resultData));
      updateTab('threat', createThreatContent(resultData));
      updateTab('geo', createGeoContent(resultData));
      updateTab('whois', createWhoisContent(resultData));
      
      // Switch to overview tab
      document.querySelector('.tab-btn[data-tab="overview"]').click();
  }

  function updateTab(tabId, content) {
      const tab = document.getElementById(`${tabId}-tab`);
      if (tab) {
          tab.innerHTML = content;
      } else {
          console.error(`Tab ${tabId} not found`);
      }
  }

  function createOverviewContent(data) {
      return `
          <div class="card">
              <h3><i class="fas fa-info-circle"></i> Overview</h3>
              <div class="info-grid">
                  <div class="info-item">
                      <strong>Target</strong>
                      <span>${data.query || data.ip || 'N/A'}</span>
                  </div>
                  ${data.country ? `
                  <div class="info-item">
                      <strong>Country</strong>
                      <span>${data.country}</span>
                  </div>
                  ` : ''}
                  ${data.isp ? `
                  <div class="info-item">
                      <strong>ISP</strong>
                      <span>${data.isp}</span>
                  </div>
                  ` : ''}
              </div>
          </div>
      `;
  }

  // Initialize the app
  setupTabs();
});