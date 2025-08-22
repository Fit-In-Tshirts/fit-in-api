import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireRole } from '../middlewares/JWT_Middleware';
import { Roles } from '../types/roles';
import { Buckets } from '../types/buckets';
import { supabaseStorage } from '../lib/supabaseStorage';

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

    const categoryToBeDeleted = await prisma.category.findUnique({
      where: {
        id: categoryId,
      }
    })

    if(!categoryToBeDeleted) {
      return res.status(404).json({
        success: false,
        message: 'No category found'
      });
    }

    //get the file path of the size-guide image
    let sizeGuideToBeDeleted = null
    if (categoryToBeDeleted.sizeGuide) {
      const urlParts = categoryToBeDeleted.sizeGuide.split('/')
      const bucketIndex = urlParts.findIndex(part => part === Buckets.SIZE_GUIDES)
      if (bucketIndex !== -1) {
        sizeGuideToBeDeleted = urlParts.slice(bucketIndex + 1).join('/')
      }
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

    if (sizeGuideToBeDeleted) {
      const { error: storageError } = await supabaseStorage.storage
        .from(Buckets.SIZE_GUIDES)
        .remove([sizeGuideToBeDeleted])
      
      if (storageError) {
        console.error('Failed to delete image from storage:', storageError)
      }
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
    const { categoryData } = req.body;

    console.log(categoryData)

    if(!categoryData || !categoryData.id) {
      return res.status(400).json({
        success: false,
        message: 'Bad Request'
      });
    }

    const CategoryToBeUpdated = await prisma.category.findUnique({
      where: {id: categoryData.id}
    })

    if(!CategoryToBeUpdated) {
      return res.status(404).json({
        success: false,
        message: 'Target category does not exist.'
      });
    }

    const prevImage = CategoryToBeUpdated.sizeGuide;

    const parsedSortOrder = (categoryData.sortOrder !== undefined && categoryData.sortOrder !== null) ? Number(categoryData.sortOrder) : 0;

    const updatedCategory = await prisma.category.update({
      where: {id: categoryData.id},
      data: {
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        sortOrder: parsedSortOrder,
        sizeGuide: categoryData.sizeGuide,
      }
    })

    if(!updatedCategory){
      return res.status(409).json({
        success: false,
        message: 'Update failed'
      });
    }

    if(prevImage !== categoryData.sizeGuide) {
      let filePath = null
      if (prevImage) {
        const urlParts = prevImage.split('/')
        const bucketIndex = urlParts.findIndex(part => part === Buckets.SIZE_GUIDES)
        if (bucketIndex !== -1) {
          filePath = urlParts.slice(bucketIndex + 1).join('/')
        }
      }
      const { error: storageError } = await supabaseStorage.storage
        .from(Buckets.SIZE_GUIDES)
        .remove([filePath!])
      
      if (storageError) {
        console.error('Failed to delete image from storage:', storageError)
      }
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
    const { categoryData } = req.body;

    if(!categoryData) {
      return res.status(400).json({
        success: false,
        message: 'Bad Request'
      });
    }

    const parsedSortOrder = (categoryData.sortOrder !== undefined && categoryData.sortOrder !== null) ? Number(categoryData.sortOrder) : 0;

    const createdCategory = await prisma.category.create({
      data: {
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        sortOrder: parsedSortOrder,
        sizeGuide: categoryData.sizeGuide
      }
    })

    if(!createdCategory){
      return res.status(409).json({
        success: false,
        message: 'Category creation failed'
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