import { Router } from 'express';
import authRoutes from './auth.routes.js';
import hospitalRoutes from './hospital.routes.js';
import inventoryRoutes from './inventory.routes.js';
import requestRoutes from './request.routes.js';
import offerRoutes from './offer.routes.js';
import transferRoutes from './transfer.routes.js';
import notificationRoutes from './notification.routes.js';
import auditRoutes from './audit.routes.js';
import userRoutes from './user.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/hospitals', hospitalRoutes);
apiRouter.use('/inventory', inventoryRoutes);
apiRouter.use('/requests', requestRoutes);
apiRouter.use('/offers', offerRoutes);
apiRouter.use('/transfers', transferRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/audit-logs', auditRoutes);

export default apiRouter;
