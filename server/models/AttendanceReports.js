// MongoDB Schema definition for AttendanceReports
import mongoose from 'mongoose';

const attendanceReportsSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  reportType: { 
    type: String, 
    enum: ['Daily', 'Weekly', 'Monthly', 'Employee', 'Project'], 
    required: true 
  },
  filters: { type: Object, default: {} },
  generatedAt: { type: String, required: true },
  generatedBy: { type: String, required: true }
}, { timestamps: true });

export default mongoose.models.AttendanceReports || mongoose.model('AttendanceReports', attendanceReportsSchema);
