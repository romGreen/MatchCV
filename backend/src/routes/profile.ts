import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { ProfileController } from '../controllers/profileController';
import { upload } from '../middleware/upload';

const router = Router();
const profileController = new ProfileController();

// Profile routes using controllers
router.post('/', authenticateToken, (req, res) => profileController.createOrUpdateProfile(req, res));
router.get('/:id', authenticateToken, (req, res) => profileController.getProfileById(req, res));
router.get('/:id/match-score', authenticateToken, (req, res) => profileController.getMatchScore(req, res));
router.post('/location', authenticateToken, (req, res) => profileController.updateLocation(req, res));
router.post('/photo', authenticateToken, upload.single('photo'), (req, res) => profileController.uploadPhoto(req, res));
router.delete('/photo/:photoId', authenticateToken, (req, res) => profileController.deletePhoto(req, res));
router.put('/photo/order', authenticateToken, (req, res) => profileController.updatePhotoOrder(req, res));

export { router as profileRoutes };