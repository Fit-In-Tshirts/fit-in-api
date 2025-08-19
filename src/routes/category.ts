import express from 'express';
import { prisma } from '../lib/prisma';

const router = express.Router();

router.get('/getall', async (req, res) => {
  try {
    const { pageSize = 10, pageIndex = 0 } = req.query

    const parsedPageSize = Math.max(1, parseInt(pageSize as string) || 10);
    const parsedPageIndex = Math.max(0, parseInt(pageIndex as string) || 0);
    const skip = parsedPageIndex * parsedPageSize;

    const categories = await prisma.category.findMany({
      skip: skip,
      take: parsedPageSize
    });

    const totalRecords = await prisma.category.count();

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