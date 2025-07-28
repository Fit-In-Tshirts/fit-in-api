import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import usersRouter from './routes/users';

dotenv.config();
const app = express();

//Middlewares
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/users', usersRouter);

app.get("/", (req, res) => {
  res.send({message: `Server running on port ${PORT}`});
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
