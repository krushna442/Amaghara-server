import Message from "../models/message.js";

// Create a new message
export const createMessage = async (req, res) => {
  try {
    const { sender, name, email, phone, subject, message ,propertyId } = req.body;

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
    res.status(201).json({ success: true, message: "Message created successfully", data: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
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
