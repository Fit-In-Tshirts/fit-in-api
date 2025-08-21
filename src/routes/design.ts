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
    const sortableColumns = ["name", "slug"];

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

    const orderBy = sortableColumns.includes(sortColumn as string) ? {[sortColumn as string]: validSortOrder} : undefined;

    const designs = await prisma.design.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
      skip: skip,
      take: parsedPageSize,
      where: whereClause,
      orderBy: orderBy
    });

    const totalRecords = await prisma.design.count({
      where: whereClause
    });

    if(!designs) {
      return res.status(204).json({
        success: true,
        message: 'No designs found',
        data: {
          designs: []
        }
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Retrieval successful',
      data: {
        designs: designs,
        totalRecords: totalRecords,
      }
    });
  } catch(error:any) {
    return res.status(404).json({
      success: false,
      message: 'No designs found'
    });
  }
  
});

router.delete('/delete_by_id', authenticateToken, requireRole([Roles.ADMIN, Roles.SUPER_ADMIN]), async(req, res)=>{
  try {
    const { id } = req.body

    if(!id) {
      return res.status(422).json({
        success: false,
        message: 'Design Id has not been received'
      });
    }

    const designId = id.toString()

    const design = await prisma.design.findUnique({
      where: {
        id: designId,
      }
    })

    if(!design) {
      return res.status(404).json({
        success: false,
        message: 'No design found'
      });
    }

    const deletedDesign = await prisma.design.delete({
      where: {
        id: designId
      }
    })

    if(!deletedDesign) {
      return res.status(409).json({
        success: false,
        message: 'Design can not be deleted'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Design deleted successfully',
    });

  } catch(error: any) {
    return res.status(404).json({
      success: false,
      message: 'No design found'
    });
  }
})

router.patch('/update', authenticateToken, requireRole([Roles.ADMIN, Roles.SUPER_ADMIN]), async(req, res) => {
  try {
    const { design } = req.body;

    if(!design) {
      return res.status(400).json({
        success: false,
        message: 'Bad Request'
      });
    }

    if(!design.id) {
      return res.status(404).json({
        success: false,
        message: 'The design you are trying to update does not exist.'
      });
    }

    const updatedDesign = await prisma.design.update({
      where: {id: design.id},
      data: {
        name: design.name,
        slug: design.slug,
        description: design.description,
      }
    })

    if(!updatedDesign){
      return res.status(409).json({
        success: false,
        message: 'Update failed'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Design updated successfully',
    });
  } catch(error:any) {
    console.error('Design update failed:', error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Design not found",
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
    const { design } = req.body;
    console.log(design);

    if(!design) {
      return res.status(400).json({
        success: false,
        message: 'Bad Request'
      });
    }

    const createdDesign = await prisma.design.create({
      data: {
        name: design.name,
        slug: design.slug,
        description: design.description,
      }
    })

    if(!createdDesign){
      return res.status(409).json({
        success: false,
        message: 'Creating design failed'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Design created successfully',
    });
  } catch(error:any) {
    console.error('design creation failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : error,
    })
  }
})

export default router;