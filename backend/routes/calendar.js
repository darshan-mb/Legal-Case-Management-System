const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const { protect, authorize } = require('../middleware/auth');

// Get upcoming hearings for advocate
router.get('/advocate-hearings', protect, authorize('advocate'), async (req, res) => {
  try {
    const cases = await Case.find({
      advocateId: req.user._id,
      nextHearingDate: { $gte: new Date() }
    })
      .populate('clientId', 'fullName email')
      .sort('nextHearingDate');
    
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching hearings', error: error.message });
  }
});

// Get upcoming hearings for client
router.get('/client-hearings', protect, authorize('client'), async (req, res) => {
  try {
    const cases = await Case.find({
      clientId: req.user._id,
      nextHearingDate: { $gte: new Date() }
    })
      .populate('advocateId', 'fullName email')
      .sort('nextHearingDate');
    
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching hearings', error: error.message });
  }
});

// Update hearing date (advocate only)
router.put('/update-hearing/:caseId', protect, authorize('advocate'), async (req, res) => {
  try {
    const { nextHearingDate } = req.body;
    const case_ = await Case.findById(req.params.caseId);

    if (!case_) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (case_.advocateId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this case' });
    }

    case_.nextHearingDate = nextHearingDate;
    case_.updatedAt = Date.now();
    await case_.save();

    res.json(case_);
  } catch (error) {
    res.status(500).json({ message: 'Error updating hearing date', error: error.message });
  }
});

module.exports = router; 