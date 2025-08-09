const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  caseNumber: {
    type: String,
    required: true,
    unique: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  advocateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caseType: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'closed'],
    default: 'pending'
  },
  filingDate: {
    type: Date,
    default: Date.now
  },
  nextHearingDate: {
    type: Date
  },
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Case', caseSchema); 