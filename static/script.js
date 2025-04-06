document.getElementById("lookupForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const input = document.getElementById("queryInput").value;
  const resultDiv = document.getElementById("result");

  resultDiv.innerHTML = "Loading...";

  try {
      const res = await fetch(`/api/lookup?query=${encodeURIComponent(input)}`);
      const data = await res.json();

      if (data.error || data.status === "fail") {
          resultDiv.innerHTML = `<p style="color: red;">Error: ${data.error || data.message}</p>`;
      } else {
          let output = "<h3>Lookup Result:</h3><ul>";
          for (const key in data) {
              output += `<li><strong>${key}</strong>: ${data[key]}</li>`;
          }
          output += "</ul>";
          resultDiv.innerHTML = output;
      }
  } catch (error) {
      resultDiv.innerHTML = `<p style="color: red;">Error fetching data</p>`;
      console.error(error);
  }
});
