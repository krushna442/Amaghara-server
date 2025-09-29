import Message from "../models/message.js";
import dotenv from 'dotenv';

// Create a new message
import nodemailer from 'nodemailer';
dotenv.config();
// Create a transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD
  }
});

export const createMessage = async (req, res) => {
  try {
    const { sender, name, email, phone, subject, message, propertyId } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const newMessage = new Message({
      sender,
      propertyId,
      name,
      email,
      phone,
      subject,
      message,
    });

    await newMessage.save();
    
    // Create HTML email template
const htmlEmail = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Message</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #2d3748;
      background-color: #f7fafc;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 650px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .content {
      padding: 40px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      color: #2d3748;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 100px 1fr;
      gap: 12px;
      margin: 5px 0;
    }
    .label {
      font-weight: 600;
      color: #4a5568;
      text-align: left;
    }
    .value {
      color: #2d3748;
    }
    .message-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      line-height: 1.8;
    }
    .footer {
      background: #f7fafc;
      padding: 30px;
      text-align: center;
      color: #718096;
      border-top: 1px solid #e2e8f0;
    }
    .timestamp {
      font-size: 14px;
      color: #a0aec0;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px; font-weight: 300;">New Contact Form Submission</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Website Contact Form</p>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="section-title">Contact Details</div>
        <div class="info-grid">
          <div class="label">Name:
          <div class="value">${name}</div>
          
          
          <div class="label">Email:</div>
          <div class="value">
            <a href="mailto:${email}" style="color: #4299e1; text-decoration: none;">
              ${email}
            </a>
          </div>
          
          <div class="label">Phone:</div>
          <div class="value">${phone || 'Not provided'}</div>
          
          <div class="label">Subject:</div>
          <div class="value">${subject}</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Message</div>
        <div class="message-box">
          ${message.replace(/\n/g, '<br>')}
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>This message was sent via your website contact form</p>
      <div class="timestamp">
        Received: ${new Date().toLocaleString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  </div>
</body>
</html>
`;

    // Setup email data
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER, // Your company email
      subject: `New Contact Form: ${subject}`,
      html: htmlEmail
    };

    // Send email
    await transporter.sendMail(mailOptions);
    
    res.status(201).json({ success: true, message: "Message created and email sent successfully", data: newMessage });
  } catch (error) {
    console.log('error in sending messsage',error)
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};



// Property Inquiry Controller
export const sendPropertyInquiry = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      message, 
      propertyDetails, 
      subject 
    } = req.body;

    // Extract property details
    const {
      id: propertyId,
      title,
      price,
      area,
      bhk,
      description,
      location,
      propertyType,
      type,
      images
    } = propertyDetails;

    // Create HTML email template for property inquiry
    const htmlEmail = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Property Inquiry</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #2d3748;
      background-color: #f7fafc;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 700px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #2b6cb8 0%, #3182ce 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .content {
      padding: 40px;
    }
    .section {
      margin-bottom: 35px;
    }
    .section-title {
      color: #2d3748;
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      border-bottom: 3px solid #3182ce;
      padding-bottom: 10px;
      display: inline-block;
    }
    .contact-info {
      background: #f8fafc;
      border-radius: 10px;
      padding: 25px;
      border-left: 4px solid #3182ce;
    }
    .info-row {
      display: flex;
      margin-bottom: 12px;
      align-items: center;
    }
    .info-row:last-child {
      margin-bottom: 0;
    }
    .label {
      font-weight: 600;
      color: #4a5568;
      min-width: 80px;
      margin-right: 15px;
    }
    .value {
      color: #2d3748;
      flex: 1;
    }
    .email-link {
      color: #3182ce;
      text-decoration: none;
    }
    .email-link:hover {
      text-decoration: underline;
    }
    .message-box {
      background: #f1f5f9;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      padding: 25px;
      margin: 20px 0;
      line-height: 1.8;
      font-style: italic;
    }
    .property-card {
      background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
      border-radius: 15px;
      padding: 30px;
      border: 2px solid #e2e8f0;
    }
    .property-header {
      margin-bottom: 25px;
    }
    .property-title {
      font-size: 24px;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 10px;
    }
    .property-price {
      font-size: 28px;
      font-weight: 800;
      color: #38a169;
      margin-bottom: 15px;
    }
    .property-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 25px;
    }
    .property-item {
      background: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      border: 1px solid #e2e8f0;
    }
    .property-item-label {
      font-size: 12px;
      color: #718096;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .property-item-value {
      font-size: 16px;
      font-weight: 600;
      color: #2d3748;
    }
    .property-description {
      background: white;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 25px;
      border: 1px solid #e2e8f0;
    }
    .property-location {
      color: #4a5568;
      font-size: 16px;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
    }
    .location-icon {
      margin-right: 8px;
    }
    .images-section {
      margin-top: 30px;
    }
    .images-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-top: 20px;
    }
    .property-image {
      width: 100%;
      height: 250px;
      object-fit: cover;
      border-radius: 10px;
      border: 3px solid #e2e8f0;
      transition: transform 0.3s ease;
    }
    .property-image:hover {
      transform: scale(1.02);
    }
    .footer {
      background: #2d3748;
      padding: 30px;
      text-align: center;
      color: #e2e8f0;
    }
    .timestamp {
      font-size: 14px;
      color: #a0aec0;
      margin-top: 15px;
    }
    .property-id {
      font-size: 12px;
      color: #718096;
      font-family: monospace;
      background: #f7fafc;
      padding: 5px 10px;
      border-radius: 5px;
      display: inline-block;
      margin-top: 10px;
    }
    @media (max-width: 600px) {
      .images-grid {
        grid-template-columns: 1fr;
      }
      .property-grid {
        grid-template-columns: 1fr;
      }
      .info-row {
        flex-direction: column;
        align-items: flex-start;
      }
      .label {
        margin-bottom: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 32px; font-weight: 300;">🏡 New Property Inquiry</h1>
      <p style="margin: 15px 0 0; opacity: 0.9; font-size: 18px;">Someone is interested in your property!</p>
    </div>
    
    <div class="content">
      <!-- Contact Information -->
      <div class="section">
        <div class="section-title">👤 Contact Information</div>
        <div class="contact-info">
          <div class="info-row">
            <div class="label">Name:</div>
            <div class="value">${name}</div>
          </div>
          <div class="info-row">
            <div class="label">Email:</div>
            <div class="value">
              <a href="mailto:${email}" class="email-link">${email}</a>
            </div>
          </div>
          <div class="info-row">
            <div class="label">Phone:</div>
            <div class="value">
              <a href="tel:${phone}" class="email-link">${phone}</a>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Message -->
      <div class="section">
        <div class="section-title">💬 Inquiry Message</div>
        <div class="message-box">
          "${message}"
        </div>
      </div>
      
      <!-- Property Details -->
      <div class="section">
        <div class="section-title">🏠 Property Details</div>
        <div class="property-card">
          <div class="property-header">
            <div class="property-title">${title}</div>
            <div class="property-price">${price}</div>
            <div class="property-location">
              <span class="location-icon">📍</span>
              ${location}
            </div>
            <div class="property-id">Property ID: ${propertyId}</div>
          </div>
          
          <div class="property-grid">
            <div class="property-item">
              <div class="property-item-label">Property Type</div>
              <div class="property-item-value">${propertyType}</div>
            </div>
            <div class="property-item">
              <div class="property-item-label">Configuration</div>
              <div class="property-item-value">${bhk} BHK</div>
            </div>
            <div class="property-item">
              <div class="property-item-label">Area</div>
              <div class="property-item-value">${area}</div>
            </div>
            <div class="property-item">
              <div class="property-item-label">Type</div>
              <div class="property-item-value">${type}</div>
            </div>
          </div>
          
          <div class="property-description">
            <strong>Description:</strong><br>
            ${description}
          </div>
          
          <!-- Property Images -->
          <div class="images-section">
            <div class="section-title" style="margin-bottom: 15px;">📸 Property Images</div>
            <div class="images-grid">
              ${images && images.length > 0 ? 
                images.slice(0, 2).map((imageUrl, index) => 
                  `<img src="${imageUrl}" alt="Property Image ${index + 1}" class="property-image">`
                ).join('') 
                : '<p style="grid-column: 1 / -1; text-align: center; color: #718096;">No images available</p>'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p style="margin: 0; font-size: 16px;">🏢 Property Inquiry System</p>
      <p style="margin: 10px 0 0; opacity: 0.8;">This inquiry was submitted through your website</p>
      <div class="timestamp">
        Received: ${new Date().toLocaleString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        })}
      </div>
    </div>
  </div>
</body>
</html>
`;

    // Setup email data
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER, // Your company email
      subject: `🏡 Property Inquiry: ${title} - ${name}`,
      html: htmlEmail,
      // Optional: Add plain text version for better compatibility
      text: `
New Property Inquiry

Contact Information:
Name: ${name}
Email: ${email}
Phone: ${phone}

Message: ${message}

Property Details:
Title: ${title}
Price: ${price}
Location: ${location}
Type: ${type}
Area: ${area}
Description: ${description}

Property ID: ${propertyId}
Received: ${new Date().toLocaleString()}
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);
    
    // Optional: Save inquiry to database
    // const newInquiry = new PropertyInquiry({
    //   name,
    //   email,
    //   phone,
    //   message,
    //   propertyId,
    //   propertyDetails,
    //   subject,
    //   createdAt: new Date()
    // });
    // await newInquiry.save();
    
    res.status(201).json({ 
      success: true, 
      message: "Property inquiry received and email sent successfully",
      data: {
        inquiryDetails: { name, email, phone, message },
        propertyDetails: { title, price, location, propertyId }
      }
    });

  } catch (error) {
    console.error('Error processing property inquiry:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to process property inquiry",
      error: error.message 
    });
  }
};

// Get all messages
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 }); // -1 = descending
;
    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Get single message by ID
export const getMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id).populate("sender", "username email");

    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    res.status(200).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Delete a message by ID
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMessage = await Message.findByIdAndDelete(id);

    if (!deletedMessage) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    res.status(200).json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
