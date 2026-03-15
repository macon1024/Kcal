const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

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

app.use('/api/auth', authRouter);
app.use('/api/foods', foodRouter);
app.use('/api/logs', logRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
