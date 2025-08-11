import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireRole } from '../middlewares/JWT_Middleware';
import { Roles } from '../types/roles';

const router = express.Router();

router.get('/getall', authenticateToken, requireRole([Roles.ADMIN, Roles.SUPER_ADMIN]),async (req, res) => {
  try{
    const customers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        addresses: {
          select: {
            houseNumber: true,
            addressLine1: true,
            addressLine2: true,
            province: true,
            city: true,
            zipCode: true,
          }
        },
        phoneNumbers: {
          select: {
            phoneNumber: true,
            phoneType: true
          }
        }
      },
      where: {
        roleId: 1
      }
    });

    if(!customers) {
      return res.status(204).json({
        success: true,
        message: 'No users found',
        data: {
          customers: []
        }
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Retrieval successful',
      data: {
        customers: customers
      }
    })
  } catch(error:any) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : error,
    })
  };
});

export default router;
