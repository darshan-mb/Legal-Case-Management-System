const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  description: String
});

module.exports = mongoose.model('Document', documentSchema); 