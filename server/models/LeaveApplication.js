// MongoDB Schema definition for Leave Applications
import mongoose from 'mongoose';

const leaveApplicationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, required: true },
  department: { type: String },
  role: { type: String, default: 'member' },
  leaveType: { 
    type: String, 
    enum: [
      'Casual Leave', 
      'Sick / Medical Leave', 
      'Earned / Annual Leave', 
      'Maternity / Paternity Leave', 
      'Emergency / Unpaid Leave', 
      'Half-Day Leave'
    ], 
    default: 'Casual Leave' 
  },
  startDate: { type: String, required: true, index: true }, // YYYY-MM-DD
  endDate: { type: String, required: true, index: true },   // YYYY-MM-DD
  totalDays: { type: Number, required: true, default: 1 },
  reason: { type: String, required: true },
  emergencyContact: { type: String, default: '' },
  handoverTo: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], 
    default: 'Pending',
    index: true
  },
  adminRemarks: { type: String, default: '' },
  appliedAt: { type: String, required: true },
  reviewedBy: { type: String },
  reviewedAt: { type: String }
}, { timestamps: true });

export default mongoose.models.LeaveApplication || mongoose.model('LeaveApplication', leaveApplicationSchema);
