document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('lookupForm');
  const queryInput = document.getElementById('queryInput');
  const lookupBtn = document.getElementById('lookupBtn');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const exampleLinks = document.querySelectorAll('.example');
  
  // Tab switching functionality
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab') + '-tab';
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Example click handlers
  exampleLinks.forEach(link => {
    link.addEventListener('click', () => {
      const query = link.getAttribute('data-query');
      queryInput.value = query;
      form.dispatchEvent(new Event('submit'));
    });
  });
  
  // Form submission handler
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const query = queryInput.value.trim();
    const queryType = document.querySelector('input[name="queryType"]:checked').value;
    
    if (!query) {
      showError('Please enter an IP, domain, or URL to analyze');
      return;
    }
    
    // Show loading state
    lookupBtn.disabled = true;
    lookupBtn.innerHTML = '<span class="spinner"></span> Analyzing...';
    
    try {
      // Clear previous results but keep active tab
      const activeTab = document.querySelector('.tab-content.active').id.replace('-tab', '');
      
      // Fetch data from our API
      const response = await fetch(`/api/lookup?query=${encodeURIComponent(query)}&type=${queryType}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Display results in different tabs
      displayOverview(data);
      displayThreatData(data);
      displayGeoData(data);
      displayWhoisData(data);
      
      // Activate the overview tab if we're on the welcome screen
      if (document.querySelector('#overview-tab .welcome-message')) {
        document.querySelector('.tab-btn[data-tab="overview"]').click();
      }
      
    } catch (error) {
      showError(error.message);
      console.error('Error:', error);
    } finally {
      // Reset button state
      lookupBtn.disabled = false;
      lookupBtn.innerHTML = '<i class="fas fa-search"></i> Analyze';
    }
  });
  
  function showError(message) {
    const overviewTab = document.getElementById('overview-tab');
    overviewTab.innerHTML = `
      <div class="card">
        <h3><i class="fas fa-exclamation-triangle"></i> Error</h3>
        <p style="color: var(--danger);">${message}</p>
        <p>Please try again or check your input.</p>
      </div>
    `;
    document.querySelector('.tab-btn[data-tab="overview"]').click();
  }
  
  function displayOverview(data) {
    const overviewTab = document.getElementById('overview-tab');
    let html = '<div class="card">';
    
    // Basic info
    html += `<h3><i class="fas fa-info-circle"></i> Overview</h3>`;
    html += `<div class="info-grid">`;
    
    if (data.query) {
      html += `<div class="info-item"><strong>Query</strong><span>${data.query}</span></div>`;
    }
    
    if (data.status) {
      html += `<div class="info-item"><strong>Status</strong><span>${data.status}</span></div>`;
    }
    
    if (data.country) {
      html += `<div class="info-item"><strong>Country</strong><span>${data.country} (${data.countryCode})</span></div>`;
    }
    
    if (data.city) {
      html += `<div class="info-item"><strong>City</strong><span>${data.city}, ${data.regionName}</span></div>`;
    }
    
    if (data.isp) {
      html += `<div class="info-item"><strong>ISP</strong><span>${data.isp}</span></div>`;
    }
    
    if (data.org) {
      html += `<div class="info-item"><strong>Organization</strong><span>${data.org}</span></div>`;
    }
    
    if (data.as) {
      html += `<div class="info-item"><strong>AS Number</strong><span>${data.as}</span></div>`;
    }
    
    // Add threat level if available
    if (data.abuseConfidenceScore) {
      let threatClass = 'threat-low';
      let threatLevel = 'Low';
      
      if (data.abuseConfidenceScore > 70) {
        threatClass = 'threat-high';
        threatLevel = 'High';
      } else if (data.abuseConfidenceScore > 30) {
        threatClass = 'threat-medium';
        threatLevel = 'Medium';
      }
      
      html += `
        <div class="info-item">
          <strong>Threat Level</strong>
          <span>
            ${data.abuseConfidenceScore}/100 
            <span class="threat-level ${threatClass}">${threatLevel}</span>
          </span>
        </div>
      `;
    }
    
    html += `</div>`; // Close info-grid
    
    // Add map if we have coordinates
    if (data.lat && data.lon) {
      html += `
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
      `;
    }
    
    html += `</div>`; // Close card
    overviewTab.innerHTML = html;
  }
  
  function displayThreatData(data) {
    const threatTab = document.getElementById('threat-tab');
    let html = '<div class="card">';
    html += `<h3><i class="fas fa-shield-virus"></i> Threat Intelligence</h3>`;
    
    // AbuseIPDB data
    if (data.abuseData) {
      html += `<h4 style="margin-top: 1rem;"><i class="fas fa-biohazard"></i> Abuse Reports</h4>`;
      html += `<div class="info-grid">`;
      html += `<div class="info-item"><strong>Confidence Score</strong><span>${data.abuseData.abuseConfidenceScore}/100</span></div>`;
      html += `<div class="info-item"><strong>Total Reports</strong><span>${data.abuseData.totalReports}</span></div>`;
      html += `<div class="info-item"><strong>Last Reported</strong><span>${formatDate(data.abuseData.lastReportedAt)}</span></div>`;
      html += `</div>`;
      
      if (data.abuseData.reports && data.abuseData.reports.length > 0) {
        html += `<h4 style="margin-top: 1.5rem;">Recent Reports</h4>`;
        html += `<div style="max-height: 300px; overflow-y: auto; margin-top: 0.5rem;">`;
        html += `<table style="width: 100%; border-collapse: collapse;">`;
        html += `<thead><tr><th style="text-align: left; padding: 0.5rem; border-bottom: 1px solid #ddd;">Date</th><th style="text-align: left; padding: 0.5rem; border-bottom: 1px solid #ddd;">Category</th><th style="text-align: left; padding: 0.5rem; border-bottom: 1px solid #ddd;">Reporter</th></tr></thead>`;
        html += `<tbody>`;
        
        data.abuseData.reports.slice(0, 5).forEach(report => {
          html += `<tr style="border-bottom: 1px solid #eee;">`;
          html += `<td style="padding: 0.5rem;">${formatDate(report.reportedAt)}</td>`;
          html += `<td style="padding: 0.5rem;">${report.categories.join(', ')}</td>`;
          html += `<td style="padding: 0.5rem;">${report.reporterCountryCode || 'Anonymous'}</td>`;
          html += `</tr>`;
        });
        
        html += `</tbody></table></div>`;
      }
    } else {
      html += `<p>No threat intelligence data available for this query.</p>`;
      html += `<p class="rate-limit">Note: Threat data is limited by API rate limits.</p>`;
    }
    
    html += `</div>`;
    threatTab.innerHTML = html;
  }
  
  function displayGeoData(data) {
    const geoTab = document.getElementById('geo-tab');
    let html = '<div class="card">';
    html += `<h3><i class="fas fa-globe-americas"></i> Geolocation Data</h3>`;
    html += `<div class="info-grid">`;
    
    if (data.country) {
      html += `<div class="info-item"><strong>Country</strong><span>${data.country} (${data.countryCode})</span></div>`;
    }
    
    if (data.regionName) {
      html += `<div class="info-item"><strong>Region</strong><span>${data.regionName} (${data.region})</span></div>`;
    }
    
    if (data.city) {
      html += `<div class="info-item"><strong>City</strong><span>${data.city}</span></div>`;
    }
    
    if (data.zip) {
      html += `<div class="info-item"><strong>Postal Code</strong><span>${data.zip}</span></div>`;
    }
    
    if (data.lat && data.lon) {
      html += `<div class="info-item"><strong>Coordinates</strong><span>${data.lat}, ${data.lon}</span></div>`;
    }
    
    if (data.timezone) {
      html += `<div class="info-item"><strong>Timezone</strong><span>${data.timezone}</span></div>`;
    }
    
    if (data.isp) {
      html += `<div class="info-item"><strong>ISP</strong><span>${data.isp}</span></div>`;
    }
    
    if (data.org) {
      html += `<div class="info-item"><strong>Organization</strong><span>${data.org}</span></div>`;
    }
    
    if (data.as) {
      html += `<div class="info-item"><strong>AS Number</strong><span>${data.as}</span></div>`;
    }
    
    html += `</div>`; // Close info-grid
    
    // Add map
    if (data.lat && data.lon) {
      html += `
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
      `;
    }
    
    html += `</div>`;
    geoTab.innerHTML = html;
  }
  
  function displayWhoisData(data) {
    const whoisTab = document.getElementById('whois-tab');
    let html = '<div class="card">';
    html += `<h3><i class="fas fa-address-card"></i> WHOIS Data</h3>`;
    
    if (data.whois) {
      html += `<pre style="white-space: pre-wrap; background: #f8f9fa; padding: 1rem; border-radius: 5px; max-height: 400px; overflow-y: auto;">${data.whois}</pre>`;
    } else {
      html += `<p>No WHOIS data available for this query.</p>`;
      html += `<p class="rate-limit">Note: WHOIS lookups may be limited by API restrictions.</p>`;
    }
    
    html += `</div>`;
    whoisTab.innerHTML = html;
  }
  
  function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString();
  }
});