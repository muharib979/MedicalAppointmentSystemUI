
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { AppointmentDto, AppointmentService, DoctorDto, MedicineDto, PatientDto, PrescriptionDto } from '../core/services/appointment.service';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { ToastrService } from 'ngx-toastr';
import { NotificationService } from '../core/services/notification.service';

pdfMake.vfs = pdfFonts.vfs;



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})

export class AppComponent implements OnInit {
  appointmentForm!: FormGroup;
  patients: PatientDto[] = [];
  doctors: DoctorDto[] = [];
  medicines: MedicineDto[] = [];
  appointments: AppointmentDto[] = [];
  selectedAppointment?: AppointmentDto;
  searchText = '';
  selectedDoctor = '';
  selectedVisitType = '';
  showForm = false;
  editMode = false;



  constructor(private fb: FormBuilder, private appointmentService: AppointmentService, private notify: NotificationService) { }

  ngOnInit(): void {
    this.initForm();
    this.loadDropdownData();
    this.getAppointments();
  }

  get filteredAppointments() {
    return this.appointments.filter(appt => {
      return (
        (this.searchText === '' || appt.patientName.toLowerCase().includes(this.searchText.toLowerCase())) &&
        (this.selectedDoctor === '' || appt.doctorName === this.selectedDoctor) &&
        (this.selectedVisitType === '' ||
          appt.visitType?.trim().toLowerCase() === this.selectedVisitType.trim().toLowerCase())

      );

    });

  }

  loadDropdownData(): void {
    this.appointmentService.getPatients().subscribe({
      next: (res) => this.patients = res,
      error: (err) => console.error('Error fetching patients', err)
    });

    this.appointmentService.getDoctors().subscribe({
      next: (res) => this.doctors = res,
      error: (err) => console.error('Error fetching doctors', err)
    });

    this.appointmentService.getMedicines().subscribe({
      next: (res) => this.medicines = res,
      error: (err) => console.error('Error fetching medicines', err)
    });
  }

  getAppointments(): void {
    this.appointmentService.getAppointment().subscribe((res) => {
      this.appointments = res;
      console.log('Appointments fetched:', this.appointments);
    })
  }

  viewDetails(id: number): void {
    this.appointmentService.getAppointmentById(id).subscribe({
      next: (res) => this.selectedAppointment = res,
      error: (err) => console.error('Error fetching appointment:', err)
    });
  }
  get prescriptions(): FormArray {
    return this.appointmentForm.get('prescriptions') as FormArray;
  }

  addPrescription(pres?: PrescriptionDto): void {
      const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toISOString().split('T')[0];
  };
    const group = this.fb.group({
      medicineId: [pres ? pres.medicineId : '', Validators.required],
      dosage: [pres ? pres.dosage : '', Validators.required],
      startDate: [pres ? formatDate(pres.startDate) : '', Validators.required],
      endDate: [pres ? formatDate(pres.endDate) : '', Validators.required],
      notes: [pres ? pres.notes : '']
    });
    this.prescriptions.push(group);
  }

  removePrescription(i: number): void {
    this.prescriptions.removeAt(i);
  }
  onAdd(): void {
    this.editMode = false;
    this.showForm = true;
    this.initForm();
  }

  onEdit(appt: AppointmentDto): void {
    console.log('Editing appointment:', appt);
    this.editMode = true;
    this.showForm = true;
    this.initForm();

    this.appointmentForm.patchValue({
      appointmentId: appt.appointmentId,
      patientId: appt.patientId,
      doctorId: appt.doctorId,
      appointmentDate: appt.appointmentDate.split('T')[0],
      visitType: appt.visitType,
      diagnosis: appt.diagnosis,
      notes: appt.notes
    });

    appt.prescriptions.forEach(p => this.addPrescription(p));
  }




  onSubmit(): void {
    if (this.appointmentForm.invalid) return;

    const formValue = this.appointmentForm.value;

    if (this.editMode) {
      this.appointmentService.updateAppointment(formValue.appointmentId, formValue)
        .subscribe({
          next: (res) => {
            this.notify.success('Appointment Updated successfully', 'Success');
            this.getAppointments();
            this.showForm = false;
          },
          error: (err) => console.error('Error updating appointment', err)
        });
    } else {

      this.appointmentService.saveAppointment(this.appointmentForm.value).subscribe({
        next: res => {
          this.notify.success('Appointment saved and Email Send successfully', 'Success');
          this.getAppointments();
          this.showForm = false;
        },
        error: err => {
          this.notify.error('Failed to save appointment', 'Error');
        }
      });
    }

  }


  deleteAppointment(id: number): void {
    if (!confirm(`Are you sure you want to delete appointment #${id}?`)) return;

    this.appointmentService.deleteAppointment(id).subscribe({
      next: (res) => {
        this.notify.success('Appointment Deleted successfully', 'Success');
        this.appointments = this.appointments.filter(a => a.appointmentId !== id);
        this.getAppointments();
      },
      error: (err) => {
        this.notify.error('Failed to save appointment', 'Error');
      }
    });
  }



  downloadAppointmentsPdf(appointmentId: number) {
    const appt = this.appointments.find(a => a.appointmentId === appointmentId);
    if (!appt) return;

    const prescriptionBody: (string | { text: string; bold?: boolean })[][] = [
      [
        { text: 'Medicine', bold: true },
        { text: 'Dosage', bold: true },
        { text: 'Start Date', bold: true },
        { text: 'End Date', bold: true }
      ],
      ...appt.prescriptions.map(pres => [
        pres.medicineName || `Medicine ${pres.medicineId}`,
        pres.dosage,
        new Date(pres.startDate).toLocaleDateString(),
        new Date(pres.endDate).toLocaleDateString()
      ])
    ];

    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: 'Prescription Report', style: 'header' },
        { text: `Patient: ${appt.patientName}`, margin: [0, 0, 0, 2] },
        { text: `Doctor: ${appt.doctorName}`, margin: [0, 0, 0, 2] },
        { text: `Date: ${new Date(appt.appointmentDate).toLocaleDateString()}`, margin: [0, 0, 0, 2] },
        { text: `Visit Type: ${appt.visitType}`, margin: [0, 0, 0, 10] },

        { text: 'Prescriptions', style: 'subheader', margin: [0, 5, 0, 5] },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', '*', '*'],
            body: prescriptionBody
          }
        }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center' as any,
          margin: [0, 0, 0, 10] as [number, number, number, number]
        },
        subheader: {
          fontSize: 14,
          bold: true
        }
      },
      defaultStyle: {
        fontSize: 10
      }
    };
    pdfMake.createPdf(docDefinition as TDocumentDefinitions).download(`Prescription_${appt.patientName}.pdf`);

  }


  initForm(): void {
    this.appointmentForm = this.fb.group({
      appointmentId: [0],
      patientId: ['', Validators.required],
      doctorId: ['', Validators.required],
      appointmentDate: ['', Validators.required],
      visitType: ['First', Validators.required],
      diagnosis: [''],
      notes: [''],
      prescriptions: this.fb.array([])
    });
  }

  onCancel(): void {
    this.showForm = false;
  }
}
