// MongoDB Schema definition for TerminationHistory
import mongoose from 'mongoose';

const terminationHistorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, required: true },
  employeeEmail: { type: String, required: true },
  attendancePercentage: { type: Number, required: true },
  reason: { type: String, default: 'Attendance Below Company Policy' },
  terminatedAt: { type: String, required: true },
  terminatedBy: { type: String, default: 'System Automated Policy' },
  status: { type: String, enum: ['Terminated', 'Reactivated'], default: 'Terminated' },
  reactivatedAt: { type: String },
  reactivatedBy: { type: String }
}, { timestamps: true });

export default mongoose.models.TerminationHistory || mongoose.model('TerminationHistory', terminationHistorySchema);
