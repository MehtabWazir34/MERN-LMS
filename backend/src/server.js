// import { app } from './app.js';
// import { connectDatabase } from './config/database.js';
// import { env } from './config/env.js';

// const startServer = async () => {
//   await connectDatabase();

//   app.listen(env.port, () => {
//     console.log(`LMS API listening on port ${env.port}`);
//   });
// };

// startServer().catch((error) => {
//   console.error('Failed to start LMS API:', error.message);
//   process.exit(1);
// });