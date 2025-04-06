document.getElementById("lookupForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const input = document.getElementById("queryInput").value.trim();
  const resultDiv = document.getElementById("result");

  if (!input) {
    resultDiv.innerHTML = '<p style="color: red;">Please enter an IP or domain</p>';
    return;
  }

  resultDiv.innerHTML = "Loading...";

  try {
    const response = await fetch(`/api/lookup?query=${encodeURIComponent(input)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();

    if (data.error || data.status === "fail") {
      resultDiv.innerHTML = `<p style="color: red;">Error: ${data.error || data.message || 'Unknown error'}</p>`;
    } else {
      let output = "<h3>Lookup Result:</h3><ul>";
      for (const key in data) {
        if (data[key] && typeof data[key] === 'string') {
          output += `<li><strong>${key}</strong>: ${data[key]}</li>`;
        }
      }
      output += "</ul>";
      resultDiv.innerHTML = output;
    }
  } catch (error) {
    console.error('Fetch error:', error);
    resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message || 'Failed to fetch data'}</p>`;
  }
});