// MongoDB Schema definition for AttendanceSettings
import mongoose from 'mongoose';

const attendanceSettingsSchema = new mongoose.Schema({
  id: { type: String, default: 'GLOBAL_CONFIG', unique: true },
  officeStartTime: { type: String, default: '09:00' },
  officeEndTime: { type: String, default: '17:00' },
  lateEntryTime: { type: String, default: '09:15' },
  workingDays: { 
    type: [String], 
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] 
  },
  minimumAttendancePct: { type: Number, default: 75 },
  warningPercentage: { type: Number, default: 50 },
  terminationPercentage: { type: Number, default: 50 }
}, { timestamps: true });

export default mongoose.models.AttendanceSettings || mongoose.model('AttendanceSettings', attendanceSettingsSchema);
