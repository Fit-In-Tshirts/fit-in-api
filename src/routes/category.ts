import express from 'express';
import { prisma } from '../lib/prisma';

const router = express.Router();

router.get('/getall', async (req, res) => {
  try {
    const { 
      pageSize = 10, 
      pageIndex = 0,
      name = '',
      slug = '',
      isActive,
      sortColumn = '',
      sortOrder = 'asc',
    } = req.query

    const parsedPageSize = Math.max(1, parseInt(pageSize as string) || 10);
    const parsedPageIndex = Math.max(0, parseInt(pageIndex as string) || 0);
    const skip = parsedPageIndex * parsedPageSize;

    const validSortOrder = ['asc', 'desc'].includes(sortOrder as string) ? sortOrder as string : 'asc';

    // whitelist valid sortable columns to avoid SQL injection 
    const sortableColumns = ["name", "slug", "sortOrder"];

    let parsedIsActive: boolean | undefined = undefined;
    if (isActive !== undefined) {
      parsedIsActive = (isActive === "true"); // "true" → true, anything else → false
    }

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
      }),
      ...(parsedIsActive !== undefined && {
        isActive: parsedIsActive
      }),
    }

    const orderBy = sortableColumns.includes(sortColumn as string) ?
      {[sortColumn as string]: validSortOrder} : undefined;

    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        isActive: true,
        sortOrder: true,
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
          customers: []
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

export default router;