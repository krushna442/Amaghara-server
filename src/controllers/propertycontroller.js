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





// Get similar properties
export const getSimilarProperties = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get the current property
        const currentProperty = await Property.findById(id);
        if (!currentProperty) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        // Extract criteria for similarity
        const { 
            location, 
            price, 
            propertyType, 
            bhk,
            city,
            state
        } = currentProperty;

        // Define price range (within ±20% of current price)
        const priceLowerBound = price * 0.8;
        const priceUpperBound = price * 1.2;

        // Try to find similar properties based on multiple criteria
        let similarProperties = await Property.find({
            _id: { $ne: id }, // Exclude current property
            isActive: true,
            $or: [
                // Same city and similar price
                {
                    'location.city': city,
                    price: { $gte: priceLowerBound, $lte: priceUpperBound }
                },
                // Same property type and similar price
                {
                    propertyType: propertyType,
                    price: { $gte: priceLowerBound, $lte: priceUpperBound }
                },
                // Same BHK and similar price
                {
                    bhk: bhk,
                    price: { $gte: priceLowerBound, $lte: priceUpperBound }
                },
                // Same city and same property type
                {
                    'location.city': city,
                    propertyType: propertyType
                },
                // Same city only (broader match)
                {
                    'location.city': city
                }
            ]
        })
        .limit(6) // Limit to 6 properties
        .select('-__v') // Exclude version field
        .lean(); // Return plain JavaScript objects

        // If we don't have enough similar properties, add random ones
        if (similarProperties.length < 6) {
            const neededCount = 6 - similarProperties.length;
            
            // Get random properties excluding current property and already selected ones
            const excludedIds = [id, ...similarProperties.map(p => p._id)];
            
            const randomProperties = await Property.aggregate([
                {
                    $match: {
                        _id: { $nin: excludedIds },
                        isActive: true
                    }
                },
                { $sample: { size: neededCount } },
                { $project: { __v: 0 } } // Exclude version field
            ]);
            
            similarProperties = [...similarProperties, ...randomProperties];
        }

        // If we still don't have enough properties (edge case), get any active properties
        if (similarProperties.length < 6) {
            const neededCount = 6 - similarProperties.length;
            const excludedIds = similarProperties.map(p => p._id);
            
            const additionalProperties = await Property.find({
                _id: { $nin: excludedIds },
                isActive: true
            })
            .limit(neededCount)
            .select('-__v')
            .lean();
            
            similarProperties = [...similarProperties, ...additionalProperties];
        }

        res.json({
            success: true,
            similarProperties,
            total: similarProperties.length
        });

    } catch (error) {
        console.error('Error fetching similar properties:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching similar properties',
            error: error.message
        });
    }
};