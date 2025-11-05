// src/shared/multiRegion/multiRegion.routes.ts

/**
 * @fileoverview Multi-region Failover Routes
 *
 * HTTP routes for multi-region failover management.
 *
 * @module shared/multiRegion/routes
 */

import { Router } from 'express';
import { MultiRegionController } from './multiRegion.controller';

const router = Router();

// Groups
router.get('/groups', MultiRegionController.listGroups);
router.get('/groups/:groupId', MultiRegionController.getGroup);

// Status
router.get('/status', MultiRegionController.getStatus);
router.get('/status/:groupId', MultiRegionController.getGroupStatus);

export default router;
