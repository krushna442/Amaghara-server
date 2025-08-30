import Property from '../models/property.js';

export const create_property = async (req, res) => {
    try {
        const propertyData = req.body; // All property fields should be sent in the request body
        const property = new Property(propertyData);
        await property.save();
        res.status(201).json({
            success: true,
            message: 'Property created successfully',
            property
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating property',
            error: error.message
        });
    }
};

export const update_property = async (req, res) => {
    try {
        const propertyId = req.params.id;
        const updateData = req.body;
        const property = await Property.findByIdAndUpdate(propertyId, updateData, { new: true });
        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }
        res.json({
            success: true,
            message: 'Property updated successfully',
            property
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating property',
            error: error.message
        });
    }
};

export const delete_property = async (req, res) => {
    try {
        const propertyId = req.params.id;
        const property = await Property.findByIdAndDelete(propertyId);
        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }
        res.json({
            success: true,
            message: 'Property deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error deleting property',
            error: error.message
        });
    }
};