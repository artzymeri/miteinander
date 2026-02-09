const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middlewares/auth');
const { adminOnly, adminOrSupport } = require('../middlewares/roleGuard');

// All routes require authentication and admin role
router.use(authenticate);
router.use(adminOnly);

// Dashboard analytics
router.get('/analytics', adminController.getDashboardAnalytics);

// Support management
router.post('/supports', adminController.createSupport);
router.get('/supports', adminController.getAllSupports);
router.get('/supports/:id', adminController.getSupportById);
router.put('/supports/:id', adminController.updateSupport);
router.delete('/supports/:id', adminController.deleteSupport);

// Care Givers management
router.get('/care-givers', adminController.getAllCareGivers);
router.get('/care-givers/:id', adminController.getCareGiverById);
router.put('/care-givers/:id', adminController.updateCareGiver);
router.delete('/care-givers/:id', adminController.deleteCareGiver);

// Care Recipients management
router.get('/care-recipients', adminController.getAllCareRecipients);
router.get('/care-recipients/:id', adminController.getCareRecipientById);
router.put('/care-recipients/:id', adminController.updateCareRecipient);
router.delete('/care-recipients/:id', adminController.deleteCareRecipient);

// Configuration - Care Needs
router.get('/config/care-needs', adminController.getAllCareNeeds);
router.post('/config/care-needs', adminController.createCareNeed);
router.put('/config/care-needs/:id', adminController.updateCareNeed);
router.delete('/config/care-needs/:id', adminController.deleteCareNeed);

module.exports = router;
