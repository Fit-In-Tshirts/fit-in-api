import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import categoryRouter from './routes/category';
import customerRouter from './routes/customer';
import userRouter from './routes/user';
import roleRouter from './routes/role';
import authRouter from './routes/auth';


dotenv.config();
const app = express();

//Middlewares
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/category', categoryRouter);
app.use('/api/customer', customerRouter);
app.use('/api/user', userRouter);
app.use('/api/role', roleRouter);
app.use('/api/auth', authRouter);

app.get("/", (req, res) => {
  res.send({message: `Server running on port ${PORT}`});
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
