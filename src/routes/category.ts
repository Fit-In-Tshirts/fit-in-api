import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireRole } from '../middlewares/JWT_Middleware';
import { Roles } from '../types/roles';

const router = express.Router();

router.get('/getall', authenticateToken, requireRole([Roles.ADMIN, Roles.SUPER_ADMIN]), async (req, res) => {
  try {
    const { 
      pageSize = 10, 
      pageIndex = 0,
      name = '',
      slug = '',
      sortColumn = '',
      sortOrder = 'asc',
    } = req.query

    const parsedPageSize = Math.max(1, parseInt(pageSize as string) || 10);
    const parsedPageIndex = Math.max(0, parseInt(pageIndex as string) || 0);
    const skip = parsedPageIndex * parsedPageSize;

    const validSortOrder = ['asc', 'desc'].includes(sortOrder as string) ? sortOrder as string : 'asc';

    // whitelist valid sortable columns to avoid SQL injection 
    const sortableColumns = ["name", "slug", "sortOrder"];

    const whereClause: any = {
      ...(name && {
        name: {
          contains: name as string,
          mode: 'insensitive'
        }
      }),
      ...(slug && {
        slug: {
          contains: slug as string,
          mode: 'insensitive'
        }
      })
    }

    const orderBy = sortableColumns.includes(sortColumn as string) ?
      {[sortColumn as string]: validSortOrder} : undefined;

    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        sortOrder: true,
        sizeGuide: true,
      },
      skip: skip,
      take: parsedPageSize,
      where: whereClause,
      orderBy: orderBy
    });

    const totalRecords = await prisma.category.count({
      where: whereClause
    });

    if(!categories) {
      return res.status(204).json({
        success: true,
        message: 'No category found',
        data: {
          categories: []
        }
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Retrieval successful',
      data: {
        categories: categories,
        totalRecords: totalRecords,
      }
    });
  } catch(error:any) {
    return res.status(404).json({
      success: false,
      message: 'No category found'
    });
  }
  
});

router.delete('/delete_by_id', authenticateToken, requireRole([Roles.ADMIN, Roles.SUPER_ADMIN]), async(req, res)=>{
  try {
    const { id } = req.body

    if(!id) {
      return res.status(422).json({
        success: false,
        message: 'Category Id has not been received'
      });
    }

    const categoryId = id.toString()

    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      }
    })

    if(!category) {
      return res.status(404).json({
        success: false,
        message: 'No category found'
      });
    }

    const deletedCategory = await prisma.category.delete({
      where: {
        id: categoryId
      }
    })

    if(!deletedCategory) {
      return res.status(409).json({
        success: false,
        message: 'Category can not be deleted'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });

  } catch(error: any) {
    return res.status(404).json({
      success: false,
      message: 'No category found'
    });
  }
})

router.patch('/update', authenticateToken, requireRole([Roles.ADMIN, Roles.SUPER_ADMIN]), async(req, res) => {
  try {
    const { category } = req.body;

    if(!category) {
      return res.status(400).json({
        success: false,
        message: 'Bad Request'
      });
    }

    if(!category.id) {
      return res.status(404).json({
        success: false,
        message: 'The Category you are trying to update does not exist.'
      });
    }

    const parsedSortOrder = (category.sortOrder !== undefined && category.sortOrder !== null) ? Number(category.sortOrder) : 0;

    const updatedCategory = await prisma.category.update({
      where: {id: category.id},
      data: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        sortOrder: parsedSortOrder,
      }
    })

    if(!updatedCategory){
      return res.status(409).json({
        success: false,
        message: 'Update failed'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
    });
  } catch(error:any) {
    console.error('Category update failed:', error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (error.code === "P2002") {
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

router.post('/create', authenticateToken, requireRole([Roles.ADMIN, Roles.SUPER_ADMIN]), async(req, res) => {
  try {
    const { category } = req.body;
    console.log(category);

    if(!category) {
      return res.status(400).json({
        success: false,
        message: 'Bad Request'
      });
    }

    const parsedSortOrder = (category.sortOrder !== undefined && category.sortOrder !== null) ? Number(category.sortOrder) : 0;

    const createdCategory = await prisma.category.create({
      data: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        sortOrder: parsedSortOrder
      }
    })

    if(!createdCategory){
      return res.status(409).json({
        success: false,
        message: 'Create failed'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Category created successfully',
    });
  } catch(error:any) {
    console.error('Category creation failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : error,
    })
  }
})

export default router;