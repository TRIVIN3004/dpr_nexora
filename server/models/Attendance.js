// MongoDB Schema definition for Attendance
import mongoose from 'mongoose';

const editHistorySchema = new mongoose.Schema({
  updatedBy: String,
  updatedAt: String,
  previousStatus: String,
  newStatus: String,
  reason: String
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, required: true },
  department: { type: String },
  project: { type: String },
  role: { type: String, default: 'member' },
  date: { type: String, required: true, index: true },
  checkInTime: { type: String },
  checkOutTime: { type: String },
  status: { 
    type: String, 
    enum: ['Present', 'Absent', 'Late', 'Half Day', 'Leave'], 
    default: 'Present' 
  },
  remarks: { type: String, default: '' },
  markedBy: { type: String, default: 'Self' }, // Self, Admin, QR, Face
  editHistory: [editHistorySchema]
}, { timestamps: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
