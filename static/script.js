document.getElementById("iocForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = document.getElementById("query").value;
    const res = await fetch(`/api/lookup.py?query=${query}`);
    const data = await res.json();
    document.getElementById("result").textContent = JSON.stringify(data, null, 2);
  });
  