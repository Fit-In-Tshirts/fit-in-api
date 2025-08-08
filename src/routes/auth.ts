import express from 'express';
import { prisma } from '../lib/prisma';
import { comparePasswords, hashPassword } from '../utils/hash';
import { PhoneType } from '../generated/prisma';

const router = express.Router();

router.post('/signup', async(req, res) => {
  try{
    const {
      firstName,
      lastName,
      email,
      password,
      address,
      phoneNumber_mobile,
      phoneNumber_home
    } = req.body;

    if(!email || !password || !firstName || !lastName || !address || !phoneNumber_mobile) {
      return res.status(400).json({success: false, message: 'Missing required fields'});
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        firstName: firstName,
        lastName: lastName,
        email: email,
        passwordHash: hashedPassword,
        roleId: 1,
      },
    });

    const createdAddress = await prisma.address.create({
      data: {
        user: { connect: { id: newUser.id } },
        houseNumber: address.houseNumber,
        addressLine1: address.addressLine_1,
        addressLine2: address.addressLine_2,
        city: address.city,
        province: address.province,
        zipCode: address.zipcode,
      }
    });

    const createdPhoneNumber_mobile = await prisma.phoneNumber.create({
      data: { 
        user: { connect: { id: newUser.id } },
        phoneNumber: phoneNumber_mobile,
        phoneType: PhoneType.MOBILE,
      }
    })

    if(phoneNumber_home) {
      const createdPhoneNumber_home = await prisma.phoneNumber.create({
      data: { 
        user: { connect: { id: newUser.id } },
        phoneNumber: phoneNumber_home,
        phoneType: PhoneType.HOME,
      }
    })
    }

    // set JWT related codes here

    return res.status(201).json({
      success: true,
      message: 'User created successfully!',
      data: {id: newUser.id, email:newUser.email}
      // send token as well
    })
  } catch(error: any) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : error,
    })
  }
})

router.post('/singin', async(req, res) => {
  try {
    const { email, password } = req.body;

    if(!email || !password ) {
      return res.status(400).json({success: false, message: 'Missing required fields'});
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (!existingUser) {
      return res.status(409).json({ success: false, message: "Email not registered" });
    }

    const isPasswordValid = await comparePasswords(password, existingUser.passwordHash);

    if(!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // set up the JWT

    const userData = {
      id: existingUser.id,
      email: existingUser.email,
      roleId: existingUser.roleId
    }

    return res.status(200).json({
      success: true,
      message: 'Signin successful',
      data: userData
      // token: token 
      // Include if using JWT
      
    });
  } catch(error) {
    console.error('Signin error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
})

export default router;