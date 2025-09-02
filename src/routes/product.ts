import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireRole } from '../middlewares/JWT_Middleware';
import { Roles } from '../types/roles';

const router = express.Router();

router.get('/getall', authenticateToken, requireRole([Roles.ADMIN, Roles.SUPER_ADMIN]),async (req, res) => {
  try {
    const { 
      pageSize = 10, 
      pageIndex = 0,
    } = req.query

    const parsedPageSize = Math.max(1, parseInt(pageSize as string) || 10);
    const parsedPageIndex = Math.max(0, parseInt(pageIndex as string) || 0);
    const skip = parsedPageIndex * parsedPageSize;

    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        brand: true,
        material: true,
        careInstructions: true,
        basePrice: true,
        discountPercentage: true,
        mainColor: true,
        mainColorId: true,
        isFeatured: true,
        status: true,
        category: {
          select: {
            id:true,
            name: true,
            sizeGuide:true,
          }
        },
        productColors: {
          select: {
            id:true,
            colorId: true,
            isMainColor: true,
            color: {
              select: {
                id:true,
                name: true,
                hexCode:true,
                rgbCode: true
              }
            }
          }
        },
        productDesigns: {
          select: {
            id: true,
            designId: true,
            design: {
              select: {
                id:true,
                name:true,
                slug:true,
                description:true,
              }
            }
          }
        },
        productSizes: {
          select: {
            id:true,
            sizeId: true,
            size: {
              select: {
                id: true,
                name: true,
                description: true,
                sortOrder: true,
              }
            }
          }
        },
        productImages: {
          select: {
            id: true,
            imageUrl: true,
            isPrimary: true,
            sortOrder:true
          }
        }
      },
      skip: skip,
      take: parsedPageSize,
    });

    const totalRecords = await prisma.product.count();

    if(!products) {
      return res.status(204).json({
        success: true,
        message: 'No products found',
        data: {
          products: [],
          totalRecords: totalRecords,
        }
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Retrieval successful',
      data: {
        products: products,
        totalRecords: totalRecords
      }
    })
  } catch(error:any) {
    return res.status(404).json({
      success: false,
      message: 'No products found'
    });
  }
})

router.delete('/delete', authenticateToken, requireRole([Roles.ADMIN, Roles.SUPER_ADMIN]),async(req, res) => {
  try{
    const { id } = req.body

    if(!id) {
      return res.status(422).json({
        success: false,
        message: 'Product Id has not been received'
      });
    }

    const productId = id.toString()

    const productToBeDeleted = await prisma.product.findUnique({
      where: {
        id: productId,
      }
    })

    if(!productToBeDeleted) {
      return res.status(404).json({
        success: false,
        message: 'No Product found'
      });
    }

    const deletedProduct = await prisma.product.delete({
      where: {
        id: productToBeDeleted.id
      }
    })

    if(!deletedProduct) {
      return res.status(409).json({
        success: false,
        message: 'Product can not be deleted'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      product: productToBeDeleted
    });
  } catch(error:any) {
    return res.status(404).json({
      success: false,
      message: 'No product found'
    });
  }
})

router.get('/get_filter_data', async(req, res) => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        name: true,
        slug:true,
      },
      orderBy: {
        name: 'asc', 
      }
    })

    const designs = await prisma.design.findMany({
      select: {
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    return res.status(200).json({
      success: true,
      message: 'Retrieval successful',
      data: {
        categoryNames: categories,
        designNames: designs
      }
    })
  } catch(error:any) {
    return res.status(404).json({
      success: false,
      message: 'No filter data found'
    });
  }

})

export default router;