import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PrescriptionDto {
  medicineId: number;
  medicineName?: string;
  dosage: string;
  startDate: string; 
  endDate: string;
  notes: string;
}

export interface AppointmentDto {
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  appointmentDate: string; 
  visitType: string;
  diagnosis: string;
  notes: string;
  prescriptions: PrescriptionDto[];
}

export interface PatientDto {
  patientId: number;
  fullName: string;
  dateOfBirth?: string;
  gender: string;
  contactNumber: string;
  address: string;
}

export interface DoctorDto {
  doctorId: number;
  fullName: string;
  specialization: string;
  contactNumber: string;
}

export interface MedicineDto {
  medicineId: number;
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private baseUrl = 'https://localhost:44336/api'; 

  constructor(private http: HttpClient) {}

 
  getPatients(): Observable<PatientDto[]> {
    return this.http.get<PatientDto[]>(`${this.baseUrl}/get-all-patients`);
  }

  getDoctors(): Observable<DoctorDto[]> {
    return this.http.get<DoctorDto[]>(`${this.baseUrl}/get-all-doctors`);
  }


  getMedicines(): Observable<MedicineDto[]> {
    return this.http.get<MedicineDto[]>(`${this.baseUrl}/get-all-medicines`);
  }

getAppointment(): Observable<AppointmentDto[]> {
    return this.http.get<AppointmentDto[]>(`${this.baseUrl}/appointments`);
  }

   getAppointmentById(id: number): Observable<AppointmentDto> {
    return this.http.get<AppointmentDto>(`${this.baseUrl}/appointments/${id}`);
  }

  saveAppointment(appointment: any){
 return this.http.post(this.baseUrl+'/save-appointment',appointment);
  }

    updateAppointment(id: number, appointment: AppointmentDto): Observable<any> {
    return this.http.put(this.baseUrl + `/appointments/${id}`, appointment);
  }

   deleteAppointment(id: number): Observable<any> {
    return this.http.delete(this.baseUrl + `/appointments/${id}`);
  }
}
