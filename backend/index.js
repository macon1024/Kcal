const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const dns = require('dns');

// Force IPv4 resolution to avoid ENETUNREACH on Render
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  console.log('Node version does not support dns.setDefaultResultOrder, skipping...');
}

dotenv.config();

console.log('##############################################');
console.log('###   KCAL BACKEND VERSION: 1.0.16-SENDGRID-WEB-API ###');
console.log('###   DEPLOYMENT TIMESTAMP: ' + new Date().toISOString() + ' ###');
console.log('##############################################');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Kcal API is running');
});


// Import Routes
const authRouter = require('./routes/auth');
const foodRouter = require('./routes/food');
const logRouter = require('./routes/log');
const aiRouter = require('./routes/ai');

app.use('/api/auth', authRouter);
app.use('/api/foods', foodRouter);
app.use('/api/logs', logRouter);
app.use('/api/ai', aiRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
