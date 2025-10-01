import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Debug database endpoint
router.get('/db', async (req: Request, res: Response) => {
  try {
    const hobbies = await prisma.hobby.findMany();
    const users = await prisma.user.findMany();
    const profiles = await prisma.profile.findMany();
    
    return res.json({
      success: true,
      data: {
        hobbies: hobbies.length,
        users: users.length,
        profiles: profiles.length,
        hobbyIds: hobbies.map(h => h.id),
        sampleHobby: hobbies[0],
        allUsers: users.map(u => ({ id: u.id, email: u.email, createdAt: u.createdAt }))
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Debug endpoint to check specific user
router.get('/user/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true }
    });
    
    return res.json({
      success: true,
      data: {
        userExists: !!user,
        user: user ? { id: user.id, email: user.email, profile: user.profile } : null
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export { router as debugRoutes };
