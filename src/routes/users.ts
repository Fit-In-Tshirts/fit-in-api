import express from 'express';
import prisma from '../prisma';

const router = express.Router();

router.get('/', async (req, res) => {
  const users = await prisma.user.findMany();
  res.send({message:200, data:users});
  
});

export default router;
