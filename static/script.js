:root {
  --primary: #4361ee;
  --danger: #f72585;
  --warning: #f8961e;
  --success: #4cc9f0;
  --dark: #212529;
  --light: #f8f9fa;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f7fa;
  color: var(--dark);
  line-height: 1.6;
  padding: 20px;
  margin: 0;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

h1 {
  color: var(--primary);
  text-align: center;
  margin-bottom: 1.5rem;
}

.input-group {
  display: flex;
  margin-bottom: 1rem;
}

#queryInput {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px 0 0 5px;
  font-size: 1rem;
}

button {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0 20px;
  border-radius: 0 5px 5px 0;
  cursor: pointer;
  transition: background 0.3s;
}

button:hover {
  background: #3a0ca3;
}

#result {
  margin-top: 2rem;
}

.welcome {
  text-align: center;
  padding: 2rem;
}

.examples {
  margin-top: 2rem;
  text-align: left;
  max-width: 500px;
  margin: 2rem auto 0;
}

.example {
  color: var(--primary);
  cursor: pointer;
  text-decoration: underline;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 1rem;
}

.tab-btn {
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  color: #666;
  position: relative;
}

.tab-btn.active {
  color: var(--primary);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 3px;
  background: var(--primary);
}

.tab-content {
  display: none;
  padding: 1rem 0;
}

.tab-content.active {
  display: block;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.info-grid div {
  margin-bottom: 0.5rem;
}

.info-grid strong {
  display: block;
  font-size: 0.9rem;
  color: #666;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.spinner {
  display: inline-block;
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(0,0,0,0.1);
  border-radius: 50%;
  border-top-color: var(--primary);
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  color: var(--danger);
  text-align: center;
  padding: 1rem;
}

pre {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 5px;
  overflow-x: auto;
  max-height: 400px;
}

@media (max-width: 768px) {
  .container {
      padding: 1rem;
  }
  
  .info-grid {
      grid-template-columns: 1fr;
  }
}