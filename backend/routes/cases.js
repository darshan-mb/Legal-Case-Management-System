const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const { protect, authorize } = require('../middleware/auth');

// Get all cases (advocate only)
router.get('/', protect, authorize('advocate'), async (req, res) => {
  try {
    const cases = await Case.find({ advocateId: req.user._id })
      .populate('clientId', 'fullName email')
      .sort('-filingDate');
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cases', error: error.message });
  }
});

// Get client's cases
router.get('/my-cases', protect, authorize('client'), async (req, res) => {
  try {
    const cases = await Case.find({ clientId: req.user._id })
      .populate('advocateId', 'fullName email')
      .sort('-filingDate');
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cases', error: error.message });
  }
});

// Get single case
router.get('/:id', protect, async (req, res) => {
  try {
    const case_ = await Case.findById(req.params.id)
      .populate('clientId', 'fullName email')
      .populate('advocateId', 'fullName email')
      .populate('documents');
    
    if (!case_) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Check if user has permission to view this case
    if (
      case_.clientId._id.toString() !== req.user._id.toString() &&
      case_.advocateId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to view this case' });
    }

    res.json(case_);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching case', error: error.message });
  }
});

// Get case by case number
router.get('/by-number/:caseNumber', protect, async (req, res) => {
  try {
    const case_ = await Case.findOne({ caseNumber: req.params.caseNumber })
      .populate('clientId', 'fullName email')
      .populate('advocateId', 'fullName email')
      .populate('documents');
    
    if (!case_) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Check if user has permission to view this case
    if (
      case_.clientId._id.toString() !== req.user._id.toString() &&
      case_.advocateId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to view this case' });
    }

    res.json({ case: case_ });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching case', error: error.message });
  }
});

// Create case (advocate only)
router.post('/', protect, authorize('advocate'), async (req, res) => {
  try {
    const { caseNumber, clientId, caseType, description, nextHearingDate } = req.body;

    const case_ = await Case.create({
      caseNumber,
      clientId,
      advocateId: req.user._id,
      caseType,
      description,
      nextHearingDate
    });

    res.status(201).json(case_);
  } catch (error) {
    res.status(500).json({ message: 'Error creating case', error: error.message });
  }
});

// Update case (advocate only)
router.put('/:id', protect, authorize('advocate'), async (req, res) => {
  try {
    const case_ = await Case.findById(req.params.id);
    
    if (!case_) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (case_.advocateId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this case' });
    }

    const updatedCase = await Case.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    res.json(updatedCase);
  } catch (error) {
    res.status(500).json({ message: 'Error updating case', error: error.message });
  }
});

module.exports = router; 