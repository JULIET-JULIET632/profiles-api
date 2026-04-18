process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:uGBJOWYpAwdrlyNIqHNPmZrtgUlesVqK@hopper.proxy.rlwy.net:54851/railway';

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
