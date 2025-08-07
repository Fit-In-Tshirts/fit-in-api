import express from 'express';
import { prisma } from '../lib/prisma';

const router = express.Router();

router.get('/getall', async (req, res) => {
  const users = await prisma.user.findMany();
  res.send({message:res.status, data:users});
});

export default router;
