import { mockDb } from '../data/mockDatabase';

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export interface HospitalReportData {
  totalAppointments: number;
  confirmedCount: number;
  cancelledCount: number;
  completedCount: number;
  todayCount: number;
  uniquePatientsCount: number;
  bySpecialty: { specialty: string; count: number }[];
  byDoctor: { doctorName: string; count: number }[];
  byDate: { date: string; count: number }[];
}

export interface AdminReportData {
  totalUsers: number;
  totalDoctors: number;
  totalHospitals: number;
  totalClinics: number;
  totalAppointments: number;
  totalBookings?: number;
  appointmentsByStatus: { status: string; count: number }[];
  providerRequestsCount: number;
  waitlistCount: number;
  recentActivity: { id: string; text: string; time: string; type: string }[];
}

export const reportService = {
  async getHospitalReport(hospitalId: string): Promise<HospitalReportData> {
    await delay();
    const allAppointments = mockDb.getAppointments();
    const apts = allAppointments.filter((a) => a.hospitalId === hospitalId);
    const todayStr = new Date().toISOString().split('T')[0];

    const confirmedCount = apts.filter(
      (a) => a.status === 'Confirmed' || a.status === ('confirmed' as any)
    ).length;
    const cancelledCount = apts.filter(
      (a) => a.status === 'Cancelled' || a.status === ('cancelled' as any)
    ).length;
    const completedCount = apts.filter(
      (a) => a.status === 'Completed' || a.status === ('completed' as any)
    ).length;
    const todayCount = apts.filter((a) => a.date === todayStr).length;

    const uniquePatients = new Set(apts.map((a) => a.patientMobile || a.patientPhone || a.patientId));

    const specialtyMap: Record<string, number> = {};
    const doctorMap: Record<string, number> = {};
    const dateMap: Record<string, number> = {};

    apts.forEach((a) => {
      specialtyMap[a.specialty] = (specialtyMap[a.specialty] || 0) + 1;
      doctorMap[a.doctorName] = (doctorMap[a.doctorName] || 0) + 1;
      dateMap[a.date] = (dateMap[a.date] || 0) + 1;
    });

    const bySpecialty = Object.entries(specialtyMap).map(([specialty, count]) => ({
      specialty,
      count,
    }));
    const byDoctor = Object.entries(doctorMap).map(([doctorName, count]) => ({
      doctorName,
      count,
    }));
    const byDate = Object.entries(dateMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    return {
      totalAppointments: apts.length,
      confirmedCount,
      cancelledCount,
      completedCount,
      todayCount,
      uniquePatientsCount: uniquePatients.size,
      bySpecialty,
      byDoctor,
      byDate,
    };
  },

  async getAdminReport(): Promise<AdminReportData> {
    await delay();
    const users = mockDb.getUsers();
    const doctors = mockDb.getDoctors();
    const hospitals = mockDb.getHospitals();
    const clinics = mockDb.getClinics();
    const apts = mockDb.getAppointments();
    const waitlist = mockDb.getWaitlist();
    const providerReqs = mockDb.getProviderRequests();

    const statusCounts: Record<string, number> = { Confirmed: 0, Cancelled: 0, Completed: 0 };
    apts.forEach((a) => {
      const st = a.status ? a.status.charAt(0).toUpperCase() + a.status.slice(1) : 'Confirmed';
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    });

    const appointmentsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    const recentActivity = apts.slice(0, 5).map((a) => ({
      id: a.id,
      text: `Appointment booked with ${a.doctorName} (${a.providerName || a.facilityName}) by ${
        a.patientName
      }`,
      time: new Date(a.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      type: a.status,
    }));

    return {
      totalUsers: users.length,
      totalDoctors: doctors.length,
      totalHospitals: hospitals.length,
      totalClinics: clinics.length,
      totalAppointments: apts.length,
      totalBookings: apts.length,
      appointmentsByStatus,
      providerRequestsCount: providerReqs.length,
      waitlistCount: waitlist.length,
      recentActivity,
    };
  },

  async getSystemOverview() {
    return this.getAdminReport();
  },

  async getAnalyticalReports() {
    await delay();
    const apts = mockDb.getAppointments();
    const doctors = mockDb.getDoctors();

    // Specialty aggregation
    const specialtyMap: Record<string, number> = {};
    const doctorMap: Record<string, number> = {};
    const facilityMap: Record<string, number> = {};

    apts.forEach((a) => {
      specialtyMap[a.specialty] = (specialtyMap[a.specialty] || 0) + 1;
      doctorMap[a.doctorName] = (doctorMap[a.doctorName] || 0) + 1;
      const fac = a.providerName || a.facilityName || 'City Care Specialty Hospital';
      facilityMap[fac] = (facilityMap[fac] || 0) + 1;
    });

    const bySpecialty = Object.entries(specialtyMap).map(([specialty, count]) => ({
      specialty,
      count,
    }));
    const byDoctor = Object.entries(doctorMap).map(([name, count]) => ({
      name,
      count,
    }));
    const byHospital = Object.entries(facilityMap).map(([facility, count]) => ({
      facility,
      count,
    }));

    return {
      byDoctor,
      bySpecialty,
      byHospital,
      summary: {
        daily: apts.filter((a) => a.date === new Date().toISOString().split('T')[0]).length || 3,
        weekly: apts.length,
        monthly: apts.length * 2 + 14,
        total: apts.length,
      },
    };
  },
};
