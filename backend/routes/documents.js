const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const Case = require('../models/Case');
const { protect } = require('../middleware/auth');

// Get all documents for a case
router.get('/case/:caseId', protect, async (req, res) => {
  try {
    const case_ = await Case.findById(req.params.caseId);
    if (!case_) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Check if user has permission to view case documents
    if (
      case_.clientId.toString() !== req.user._id.toString() &&
      case_.advocateId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to view these documents' });
    }

    const documents = await Document.find({ caseId: req.params.caseId })
      .populate('uploadedBy', 'fullName role');
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching documents', error: error.message });
  }
});

// Upload document
router.post('/', protect, async (req, res) => {
  try {
    const { caseId, title, fileUrl, fileType, description } = req.body;

    // Check if case exists and user has permission
    const case_ = await Case.findById(caseId);
    if (!case_) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (
      case_.clientId.toString() !== req.user._id.toString() &&
      case_.advocateId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to upload documents to this case' });
    }

    const document = await Document.create({
      caseId,
      uploadedBy: req.user._id,
      title,
      fileUrl,
      fileType,
      description
    });

    // Add document reference to case
    await Case.findByIdAndUpdate(caseId, {
      $push: { documents: document._id }
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: 'Error uploading document', error: error.message });
  }
});

// Delete document (only by uploader)
router.delete('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this document' });
    }

    await Document.findByIdAndDelete(req.params.id);
    
    // Remove document reference from case
    await Case.findByIdAndUpdate(document.caseId, {
      $pull: { documents: document._id }
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting document', error: error.message });
  }
});

module.exports = router; 