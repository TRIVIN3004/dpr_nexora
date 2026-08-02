// MongoDB Schema definition for AttendanceWarnings
import mongoose from 'mongoose';

const attendanceWarningsSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, required: true },
  employeeEmail: { type: String, required: true },
  percentage: { type: Number, required: true },
  warningType: { type: String, default: 'Below 75%' },
  message: { type: String, required: true },
  issuedAt: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Acknowledged', 'Resolved'], default: 'Active' }
}, { timestamps: true });

export default mongoose.models.AttendanceWarnings || mongoose.model('AttendanceWarnings', attendanceWarningsSchema);
