import express from 'express';
import { prisma } from '../lib/prisma';

const router = express.Router();

router.get('/getall', async (req, res) => {
  const users = await prisma.user.findMany();
  res.send({message:200, data:users});
});

router.post('/signup', async(req, res) => {
  try {
    const {id, firstName, lastName, email, passwordHash} = req.body;

    if(!id || !firstName || !lastName || !email || !passwordHash) {
      return res.status(400).json({message: 'Missing fields'});
    }

    const isUserExisting = await prisma.user.findFirst({
      where: { email : email}
    })

    console.log('user existence: ', isUserExisting);

    // remove this after cleaning the front-end
    if (isUserExisting) {
      return res.status(409).json({ message: 'User already exists' });
    } 

    const user = await prisma.user.create({
      data: {
        id : id,
        firstName : firstName,
        lastName : lastName,
        email : email,
        passwordHash : passwordHash,
        roleId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })

    res.status(201).json({user})
  } catch(error: any) {
    console.error('Signup error: ', error)
    res.status(500).json({ error: 'Internal Server Error, Check "/signup" endpoint.' })
  }
})

export default router;
