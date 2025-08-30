import express from 'express';
import { adminAuth } from '../../auth/adminAuth.js';
import { create_property, update_property ,delete_property } from '../controllers/propertycontroller.js';
const router = express.Router();
import Property from '../models/property.js';




router .post ('/property',adminAuth ,create_property);
router.get('/property', async (req, res) => {
    try {
        const properties = await Property.find();
        res.json({
            success: true,
            properties
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error fetching properties',
            error: error.message
        });
    }
});
router.put('/property/:id', adminAuth, update_property);
router.delete('/property/:id', adminAuth, delete_property);
router.get('/property/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.json({
      success: true,
      property
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching property',
      error: error.message
    });
  }
});


export default router;