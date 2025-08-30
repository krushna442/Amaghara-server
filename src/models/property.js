import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 70,
    },
    description: {
      type: String,
      maxlength: 4096,
    },
    price: {
      type: Number,
      required: true,
    },
    propertyType: {
      type: String,
      enum: [
        "Flats/Apartments",
        "Independent/Builder Floors",
        "Individual House/Villa",
        "Commercial",
      ],
      required: true,
    },

    bhk: {
      type: Number,
      enum: [1, 2, 3, 4, 5], 
      required: true,
    },
    bathrooms: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      required: true,
    },
    furnishing: {
      type: String,
      enum: ["Furnished", "Semi-Furnished", "Unfurnished"],
      required: true,
    },

    superBuiltupArea: {
      value: Number,
      unit: { type: String, enum: ["sqft", "sqm"], default: "sqft" },
    },
    carpetArea: {
      value: Number,
      unit: { type: String, enum: ["sqft", "sqm"], default: "sqft" },
    },

    totalFloors: Number,
    floorNo: Number,
    facing: String,

    bachelorsAllowed: {
      type: Boolean,
      default: false,
    },
    maintenanceMonthly: Number,

    carParking: {
      type: Number,
      enum: [0, 1, 2, 3, 4], // 4 represents 3+
      default: 0,
    },

    location: {
      address: String,
      city: String,
      state: String,
      country: { type: String, default: "India" },
      zipCode: String,
    },

    images: [
      {
        url: String, // Cloudinary/S3 URL
        isPrimary: Boolean,
        caption: String,
      },
    ],
    pictures: [String],

    amenities: [String], // ["Swimming Pool", "Gym", "Park", "Power Backup"]

    contactNumber: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: Date,
    views: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Add text index for search
propertySchema.index({
  title: "text",
  description: "text",
  "location.address": "text",
  "location.city": "text",
});

const Property = mongoose.model("Property", propertySchema);
export default Property;
