document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('lookupForm');
  const queryInput = document.getElementById('queryInput');
  const lookupBtn = document.getElementById('lookupBtn');
  const resultDiv = document.getElementById('result');

  // Tab management
  function setupTabs() {
      document.querySelectorAll('.tab-btn').forEach(btn => {
          btn.addEventListener('click', () => {
              const tabId = btn.getAttribute('data-tab');
              document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
              document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
              
              btn.classList.add('active');
              document.getElementById(`${tabId}-tab`).classList.add('active');
          });
      });
  }

  // Form submission handler
  form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const query = queryInput.value.trim();
      
      if (!query) {
          showError('Please enter an IP or domain');
          return;
      }

      showLoading(true);
      
      try {
          // Clear previous errors
          document.querySelectorAll('.error').forEach(el => el.remove());
          
          const response = await fetch(`/api/lookup?query=${encodeURIComponent(query)}`);
          const data = await response.json();

          if (!response.ok) {
              throw new Error(data.message || 'API request failed');
          }

          displayResults(data);
          
      } catch (error) {
          showError(error.message);
          console.error('API Error:', error);
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
      const errorEl = document.createElement('div');
      errorEl.className = 'error';
      errorEl.innerHTML = `
          <div class="error-card">
              <i class="fas fa-exclamation-triangle"></i>
              <h3>Error</h3>
              <p>${message}</p>
          </div>
      `;
      resultDiv.appendChild(errorEl);
  }

  function displayResults(data) {
      // Ensure we have data to display
      if (!data || typeof data !== 'object') {
          showError('Invalid data received from server');
          return;
      }

      // Process and display data in respective tabs
      updateTabContent('overview', createOverviewContent(data));
      updateTabContent('threat', createThreatContent(data));
      updateTabContent('geo', createGeoContent(data));
      updateTabContent('whois', createWhoisContent(data));

      // Switch to overview tab
      document.querySelector('.tab-btn[data-tab="overview"]').click();
  }

  // Helper functions for tab content creation
  function createOverviewContent(data) {
      return `
          <div class="card">
              <h3><i class="fas fa-info-circle"></i> Overview</h3>
              <div class="info-item">
                  <strong>Query:</strong> ${data.query || 'N/A'}
              </div>
              <div class="info-item">
                  <strong>Status:</strong> ${data.status || 'unknown'}
              </div>
          </div>
      `;
  }

  // Initialize
  setupTabs();
});