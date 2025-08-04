const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// In-memory storage (replace with database in production)
let users = [];
let exercises = [];
let userIdCounter = 1;
let exerciseIdCounter = 1;

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// POST /api/users - Create a new user
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.json({ error: 'Username is required' });
  }

  const newUser = {
    _id: userIdCounter.toString(),
    username: username
  };
  
  users.push(newUser);
  userIdCounter++;
  
  res.json(newUser);
});

// GET /api/users - Get all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// POST /api/users/:_id/exercises - Add exercise for user
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;
  
  // Find user
  const user = users.find(u => u._id === userId);
  if (!user) {
    return res.json({ error: 'User not found' });
  }
  
  // Validate required fields
  if (!description || !duration) {
    return res.json({ error: 'Description and duration are required' });
  }
  
  // Parse duration to number
  const durationNum = parseInt(duration);
  if (isNaN(durationNum)) {
    return res.json({ error: 'Duration must be a number' });
  }
  
  // Handle date
  let exerciseDate;
  if (date) {
    exerciseDate = new Date(date);
    if (isNaN(exerciseDate.getTime())) {
      return res.json({ error: 'Invalid date format' });
    }
  } else {
    exerciseDate = new Date();
  }
  
  const newExercise = {
    _id: exerciseIdCounter.toString(),
    userId: userId,
    description: description,
    duration: durationNum,
    date: exerciseDate.toDateString()
  };
  
  exercises.push(newExercise);
  exerciseIdCounter++;
  
  // Return user object with exercise fields added
  res.json({
    _id: user._id,
    username: user.username,
    description: newExercise.description,
    duration: newExercise.duration,
    date: newExercise.date
  });
});

// GET /api/users/:_id/logs - Get user's exercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;
  
  // Find user
  const user = users.find(u => u._id === userId);
  if (!user) {
    return res.json({ error: 'User not found' });
  }
  
  // Get user's exercises
  let userExercises = exercises.filter(ex => ex.userId === userId);
  
  // Apply date filters
  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate.getTime())) {
      userExercises = userExercises.filter(ex => new Date(ex.date) >= fromDate);
    }
  }
  
  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate.getTime())) {
      userExercises = userExercises.filter(ex => new Date(ex.date) <= toDate);
    }
  }
  
  // Apply limit
  if (limit && !isNaN(parseInt(limit))) {
    userExercises = userExercises.slice(0, parseInt(limit));
  }
  
  // Format log entries (remove userId and _id from exercise objects)
  const log = userExercises.map(ex => ({
    description: ex.description,
    duration: ex.duration,
    date: ex.date
  }));
  
  res.json({
    _id: user._id,
    username: user.username,
    count: log.length,
    log: log
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});