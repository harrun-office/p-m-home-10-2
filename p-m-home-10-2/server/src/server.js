require('dotenv').config();
const app = require('./app');

const PORT = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, () => {
  const baseUrl = `http://localhost:${PORT}`;
  console.log(`Server running at ${baseUrl}`);
});
