import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireRole } from '../middlewares/JWT_Middleware';
import { Roles } from '../types/roles';

const router = express.Router();

router.get('/getall', authenticateToken, requireRole([Roles.ADMIN, Roles.SUPER_ADMIN]), async (req, res) => {
  try{
    const {
      pageSize = 10,
      pageIndex = 0,
      
      sortColumn,
      sortOrder = 'asc',
      
      email = '',
      firstName = '',
      lastName = '',
      houseNumber = '',
      addressLine1 = '',
      addressLine2 = '',
      province = '',
      city = '',
      zipcode = ''
    } = req.query;

    // Convert and validate pagination parameters
    const parsedPageSize = Math.max(1, parseInt(pageSize as string) || 10);
    const parsedPageIndex = Math.max(0, parseInt(pageIndex as string) || 0);
    const skip = parsedPageIndex * parsedPageSize;

    // Validate sort order
    const validSortOrder = ['asc', 'desc'].includes(sortOrder as string) ? sortOrder as string : 'asc';

    //Build where clause for filtering
    const whereClause: any = {
      roleId: Roles.CUSTOMER,
      ...(email && {
        email: {
          contains: email as string,
          mode: 'insensitive'
        }
      }),
      ...(firstName && {
        firstName: {
          contains: firstName as string,
          mode: 'insensitive'
        }
      }),
      ...(lastName && {
        lastName: {
          contains: lastName as string,
          mode: 'insensitive'
        }
      })
    };

    // Add address-related filters
    const addressFilters: any = {};

    if (houseNumber) {
      addressFilters.houseNumber = {
        contains: houseNumber as string,
        mode: 'insensitive'
      };
    }
    if (addressLine1) {
      addressFilters.addressLine1 = {
        contains: addressLine1 as string,
        mode: 'insensitive'
      };
    }
    if (addressLine2) {
      addressFilters.addressLine2 = {
        contains: addressLine2 as string,
        mode: 'insensitive'
      };
    }
    if (province) {
      addressFilters.province = {
        contains: province as string,
        mode: 'insensitive'
      };
    }
    if (city) {
      addressFilters.city = {
        contains: city as string,
        mode: 'insensitive'
      };
    }
    if (zipcode) {
      addressFilters.zipcode = {
        contains: zipcode as string,
        mode: 'insensitive'
      };
    }

    if (Object.keys(addressFilters).length > 0) {
      whereClause.addresses = {
        some: addressFilters
      };
    }

    let orderBy: any = {};

    if (sortColumn) {
      const SortColumn = sortColumn as string;
      
      // Handle user-level fields
      if (['email', 'firstName', 'lastName'].includes(SortColumn)) {
        orderBy[SortColumn] = validSortOrder;
      }
      // Handle address-level fields
      else if (['houseNumber', 'addressLine1', 'addressLine2', 'province', 'city', 'zipcode'].includes(SortColumn)) {
        orderBy.addresses = {
          _count: validSortOrder === 'asc' ? 'desc' : 'asc' // This is a workaround for nested sorting
        };
        // Note: Prisma doesn't support direct sorting by nested fields easily
        // You might need to handle this differently based on your requirements
      }
    }

    // If no valid sort column, default to id
    if (Object.keys(orderBy).length === 0) {
      orderBy.id = 'asc';
    }

    // Get total count for pagination
    const totalRecords = await prisma.user.count({
      where: whereClause
    });


    const customers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        addresses: {
          select: {
            id: true,
            houseNumber: true,
            addressLine1: true,
            addressLine2: true,
            province: true,
            city: true,
            zipcode: true,
          }
        },
        phoneNumbers: {
          select: {
            id: true,
            phoneNumber: true,
            phoneType: true
          }
        }
      },
      where: whereClause,
      orderBy: orderBy,
      skip: skip,
      take: parsedPageSize
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
        customers: customers,
        totalRecords: totalRecords,
      }
    });
  } catch(error:any) {
    console.error('Customer retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : error,
    })
  };
});

router.get('/get_by_id', authenticateToken, requireRole([Roles.ADMIN, Roles.SUPER_ADMIN]), async (req, res) => {
  try {
    const {id} = req.query;

    if(!id) {
      return res.status(422).json({
        success: false,
        message: 'Customer Id has not been received'
      });
    }

    const customerId = id.toString()

    const customer = await prisma.user.findUnique({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        addresses: {
          select: {
            id: true,
            houseNumber: true,
            addressLine1: true,
            addressLine2: true,
            province: true,
            city: true,
            zipcode: true,
          }
        },
        phoneNumbers: {
          select: {
            id:true,
            phoneNumber: true,
            phoneType: true
          }
        }
      },
      where: {
        id: customerId,
      }
    })

    if(!customer) {
      return res.status(204).json({
        success: false,
        message: 'No customer found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer found',
      data: customer
    });

  }catch(error:any) {
    console.error('Customer retrieval by Id error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : error,
    })
  }
})

router.delete('/delete_by_id', authenticateToken, requireRole([Roles.ADMIN, Roles.SUPER_ADMIN]), async (req, res) => {
  try {
    const { id } = req.body

    if(!id) {
      return res.status(422).json({
        success: false,
        message: 'Customer Id has not been received'
      });
    }

    const customerId = id.toString()

    const customer = await prisma.user.findUnique({
      where: {
        id: customerId,
        roleId: Roles.CUSTOMER
      }
    })

    if(!customer) {
      return res.status(404).json({
        success: false,
        message: 'No customer found'
      });
    }

    const deletedUser = await prisma.user.delete({
      where: {
        id: customerId
      }
    })

    if(!deletedUser) {
      return res.status(409).json({
        success: false,
        message: 'User can not be deleted'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    });

  } catch(error:any) {
    console.error('Customer deletion by Id error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : error,
    })
  }
})

router.patch('/update', authenticateToken, requireRole([Roles.ADMIN, Roles.SUPER_ADMIN]), async (req, res) => {
  try {
    const {personalInfo, addressInfo, contactInfo} = req.body;

    if(!personalInfo.id) {
      return res.status(404).json({
        success: false,
        message: 'The Customer you are trying to update does not exist.'
      });
    }
    if(!addressInfo.id) {
      return res.status(404).json({
        success: false,
        message: 'The address you are trying to update does not exist.'
      });
    }
    if(!contactInfo[0].id) {
      return res.status(404).json({
        success: false,
        message: 'The phone number you are trying to update does not exist.'
      });
    }

    const updatedCustomer = await prisma.user.update({
      where: {id : personalInfo.id},
      data: {
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        addresses: {
          update: {
            where: {id: addressInfo.id},
            data: {
              houseNumber: addressInfo.houseNumber,
              addressLine1: addressInfo.addressLine1,
              addressLine2: addressInfo.addressLine2,
              province: addressInfo.province,
              city: addressInfo.city,
              zipcode: addressInfo.zipcode
            }
          }
        },
        phoneNumbers: {
          updateMany: [
            {
              where: {id: contactInfo.id},
              data: {
                phoneNumber: contactInfo.phoneNumber
              }
            }
          ]
        }
      }
    })

    if(!updatedCustomer){
      return res.status(409).json({
        success: false,
        message: 'Update failed'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
    });
  } catch(error:any) {
    console.error('Customer update failed:', error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (error.code === "P2002") { // Unique constraint failed
      return res.status(409).json({
        success: false,
        message: "Conflict: duplicate value",
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : error,
    })
  }
})

export default router;
