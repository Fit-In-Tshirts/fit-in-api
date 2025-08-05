import express from 'express';
import prisma from '../prisma';

const router = express.Router();

router.get('/', async (req, res) => {
  const roles = await prisma.role.findMany();
  res.send({message:res.status , data:roles});
});

export default router;
