"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/Button';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon, 
  ArrowRightIcon,
  ClipboardDocumentCheckIcon,
  UserIcon,
  HomeIcon,
  IdentificationIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  Squares2X2Icon,
  TrophyIcon,
  UsersIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ArrowUpIcon,
  EyeIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import RIDSForm from '../../../../../RIDSForm';

// Define the RIDS data interface expected by the API (can be kept or updated)
interface RIDSData {
  personalInformation: {
    fullName: string;
    dateOfBirth: string;
    placeOfBirth: string;
    gender: string;
    civilStatus: string;
    religion: string;
    citizenship: string; // Assuming 'Filipino' as default from original page.tsx
    bloodType: string;
  };
  contactInformation: {
    residentialAddress: string; // e.g., Home Address + Town/City/Province/ZIP
    mobileNumber: string;
    officePhone?: string;
    emailAddress: string;
  };
  identificationInfo: {
    serviceId: string; // This corresponds to AFPSN in RIDSForm
    height: string;
    weight: string;
    sssNumber?: string;
    tinNumber?: string;
    philHealthNumber?: string;
    // pagIbigNumber?: string; // Not in RIDSForm.tsx
  };
  educationalBackground: {
    highestEducation: string; // This might need mapping from RIDSForm.education.course if a level is needed
    course?: string;
    school: string;
    yearGraduated: string;
  };
  occupationInfo: {
    occupation: string;
    // employer?: string; // Not directly in RIDSForm, Company Name & Address covers it
    officeAddress?: string; // Company Name & Address in RIDSForm
  };
  militaryTraining: {
    name: string; // RIDSForm.schooling
    authority: string; // Not directly in RIDSForm.militaryTraining
    dateCompleted: string; // RIDSForm.dateGraduated
  }[];
  specialSkills: string[]; // RIDSForm.specialSkills is a string, might need to be an array or processed
  awards: {
    title: string; // RIDSForm.award
    authority: string;
    dateAwarded: string;
  }[];
  assignments: { // Corresponds to RIDSForm.unitAssignment
    unitName: string; // RIDSForm.unit
    authority: string;
    dateFrom: string;
    dateTo: string;
  }[];
  // Fields from the top section of RIDSForm, mapping needed
  rank?: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  afpsn?: string; // Same as identificationInfo.serviceId
  brsvc?: string;
  sourceOfCommission?: string; // RIDSForm.sourceOfCommission (potentially checkbox values)
  initialRank?: string;
  dateOfComsnEnlist?: string;
  commissionAuthority?: string; // RIDSForm.authority (for commission)
  reservistClassification?: string;
  mobilizationCenter?: string;
  unitDesignation?: string; // RIDSForm.designation (top section)
  squadTeamSection?: string; // RIDSForm.squad
  platoon?: string;
  company?: string;
  battalionBrigadeDivision?: string; // RIDSForm.battalion
  sizeOfCombatShoes?: string;
  sizeOfCap?: string;
  sizeOfBDU?: string; // RIDSForm.sizeOfBDA

  dependents?: {
    relation: string;
    name: string;
  }[];

  // These fields from old RIDSData might need mapping from RIDSForm or are new
  filePath?: string; // Not in RIDSForm
  // afpos related fields from original RIDSData like cadetAct, rotc, etc. need mapping if afpos in RIDSForm is used for them
}

// Helper function to transform formData to RIDSData for API
const transformRIDSFormDataForAPI = (formData: any): Partial<RIDSData> => {
  // Helper to safely map array data
  const safeMap = (arr: any[] | undefined, mapFn: (item: any) => any) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return [];
    return arr.map(mapFn);
  };
  
  return {
    // Basic fields
    rank: formData.rank || '',
    lastName: formData.lastName || '',
    firstName: formData.firstName || '',
    middleName: formData.middleName || '',
    afpsn: formData.afpsn || '',
    brsvc: formData.brSvc || '',
    sourceOfCommission: formData.sourceOfCommission || '',
    
    // Structured sections
    personalInformation: {
      fullName: `${formData.lastName || ''}, ${formData.firstName || ''} ${formData.middleName || ''}`.trim(),
      dateOfBirth: formData.birthdate || '',
      placeOfBirth: formData.birthPlace || '',
      gender: formData.sex || 'Male',
      civilStatus: formData.maritalStatus || 'Single',
      religion: formData.religion || '',
      citizenship: 'Filipino',
      bloodType: formData.bloodType || '',
    },
    
    contactInformation: {
      residentialAddress: `${formData.homeAddress || ''} ${formData.townCityProvinceZip || ''}`.trim(),
      mobileNumber: formData.mobileTelNr || '',
      officePhone: formData.officeTelNr || '',
      emailAddress: formData.emailAddress || '',
    },
    
    identificationInfo: {
      serviceId: formData.afpsn || '',
      height: formData.height || '',
      weight: formData.weight || '',
      sssNumber: formData.sssNr || '',
      tinNumber: formData.tin || '',
      philHealthNumber: formData.philhealthNr || '',
    },
    
    educationalBackground: {
      highestEducation: formData.education?.course || 'N/A',
      course: formData.education?.course || '',
      school: formData.education?.school || '',
      yearGraduated: formData.education?.dateGraduated || '',
    },
    
    occupationInfo: {
      occupation: formData.presentOccupation || '',
      officeAddress: formData.companyNameAddress || '',
    },
    
    // Arrays with safe mapping
    militaryTraining: safeMap(formData.militaryTraining, (mt: any) => ({
      name: mt.schooling || '',
      authority: 'N/A',
      dateCompleted: mt.dateGraduated || '',
    })),
    
    specialSkills: formData.specialSkills 
      ? formData.specialSkills.split(',').map((s:string) => s.trim()) 
      : [],
    
    awards: safeMap(formData.awards, (aw: any) => ({
      title: aw.award || '',
      authority: aw.authority || '',
      dateAwarded: aw.dateAwarded || '',
    })),
    
    dependents: safeMap(formData.dependents, (dep: any) => ({
      relation: dep.relation || '',
      name: dep.name || '',
    })),
    
    assignments: safeMap(formData.unitAssignment, (ua: any) => ({
      unitName: ua.unit || '',
      authority: ua.authority || '',
      dateFrom: ua.dateFrom || '',
      dateTo: ua.dateTo || '',
    })),
  };
};

export default function CreateRIDSPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const ridsFormRef = useRef<any>(null); // Ref for RIDSForm component

  // Section-based form state
  enum FormSection {
    RESERVIST_PERSONNEL = "Reservist Personnel Information",
    PERSONAL_INFO = "Personal Information",
    PROMOTION = "Promotion/Demotion",
    MILITARY = "Military Training",
    AWARDS = "Awards and Decoration",
    DEPENDENTS = "Dependents Information",
    EDUCATIONAL = "Educational Background",
    CAD_OJT_ADT = "CAD/OJT/ADT",
    ASSIGNMENT = "Unit Assignment",
    DESIGNATION = "Designation",
    REVIEW = "Review and Submit"
  }
  
  const [currentSection, setCurrentSection] = useState<FormSection>(FormSection.RESERVIST_PERSONNEL);
  const [formData, setFormData] = useState({
    // Reservist Personnel Information
    rank: '',
    lastName: '',
    firstName: '',
    middleName: '',
    afpsn: '',
    brSvc: '',
    afpos: '',
    sourceOfCommission: '',
    initialRank: '',
    dateOfComsnEnlist: '',
    authority: '',
    reservistClassification: 'STANDBY', // Default value
    mobilizationCenter: '',
    designation: '',
    squad: '',
    platoon: '',
    company: '',
    battalion: '',
    sizeOfCombatShoes: '',
    sizeOfCap: '',
    sizeOfBDA: '',
    
    // Personal Information
    presentOccupation: '',
    companyNameAddress: '',
    officeTelNr: '',
    homeAddress: '',
    townCityProvinceZip: '',
    resTelNr: '',
    mobileTelNr: '',
    birthdate: '',
    birthPlace: '',
    age: '',
    religion: '',
    bloodType: '',
    tin: '',
    sssNr: '',
    philhealthNr: '',
    height: '',
    weight: '',
    maritalStatus: 'Single', // Default value
    sex: 'Male', // Default value
    fbAccount: '',
    emailAddress: '',
    specialSkills: '',
    languageDialect: '',
    
    // Additional sections
    promotions: [{ rank: '', date: '', authority: '' }],
    militaryTraining: [{ schooling: '', school: '', dateGraduated: '' }],
    awards: [{ award: '', authority: '', dateAwarded: '' }],
    dependents: [{ relation: '', name: '' }],
    education: { course: '', school: '', dateGraduated: '' },
    cadOjt: [{ unit: '', purpose: '', dateStart: '', dateEnd: '' }],
    unitAssignment: [{ unit: '', authority: '', dateFrom: '', dateTo: '' }],
    designationTable: [{ position: '', authority: '', dateFrom: '', dateTo: '' }]
  });
  
  // Track if sections are completed
  const [completedSections, setCompletedSections] = useState<Set<FormSection>>(new Set());
  const [sectionValidationErrors, setSectionValidationErrors] = useState<Record<FormSection, string[]>>({} as Record<FormSection, string[]>);

  // Function to handle input change
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Function to handle array change
  const handleArrayChange = (section: string, index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: (prev[section as keyof typeof prev] as any[]).map((item: any, i: number) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Function to add an item to an array
  const addArrayItem = (section: string, template: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...(prev[section as keyof typeof prev] as any[]), template]
    }));
  };

  // Function to handle education change
  const handleEducationChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      education: {
        ...prev.education,
        [field]: value
      }
    }));
  };

  // Function to validate current section
  const validateSection = (section: FormSection): string[] => {
    const errors: string[] = [];
    
    switch(section) {
      case FormSection.RESERVIST_PERSONNEL:
        if (!formData.lastName) errors.push("Last Name is required");
        if (!formData.firstName) errors.push("First Name is required");
        if (!formData.rank) errors.push("Rank is required");
        if (!formData.afpsn) errors.push("AFPSN is required");
        break;
      
      case FormSection.PERSONAL_INFO:
        if (!formData.homeAddress) errors.push("Home Address is required");
        if (!formData.mobileTelNr) errors.push("Mobile Number is required");
        if (!formData.birthdate) errors.push("Birthdate is required");
        break;
      
      case FormSection.PROMOTION:
        // No required fields for now
        break;
        
      case FormSection.MILITARY:
        // No required fields for now
        break;
        
      case FormSection.AWARDS:
        // No required fields for now
        break;
        
      case FormSection.DEPENDENTS:
        // No required fields for now
        break;
        
      case FormSection.EDUCATIONAL:
        // No required fields for now
        break;
        
      case FormSection.CAD_OJT_ADT:
        // No required fields for now
        break;
        
      case FormSection.ASSIGNMENT:
        // No required fields for now
        break;
        
      case FormSection.DESIGNATION:
        // No required fields for now
        break;
    }
    
    return errors;
  };

  // Function to navigate to next section
  const goToNextSection = () => {
    const errors = validateSection(currentSection);
    
    if (errors.length > 0) {
      setSectionValidationErrors({
        ...sectionValidationErrors,
        [currentSection]: errors
      });
      return;
    }
    
    // Mark current section as completed
    const newCompletedSections = new Set(completedSections);
    newCompletedSections.add(currentSection);
    setCompletedSections(newCompletedSections);
    
    // Determine next section
    const sectionValues = Object.values(FormSection);
    const currentIndex = sectionValues.indexOf(currentSection);
    
    if (currentIndex < sectionValues.length - 1) {
      setCurrentSection(sectionValues[currentIndex + 1]);
    }
  };

  // Function to navigate to previous section
  const goToPreviousSection = () => {
    const sectionValues = Object.values(FormSection);
    const currentIndex = sectionValues.indexOf(currentSection);
    
    if (currentIndex > 0) {
      setCurrentSection(sectionValues[currentIndex - 1]);
    }
  };

  // Function to go to a specific section
  const goToSection = (section: FormSection) => {
    // Only allow navigation to completed sections or the next incomplete section
    if (completedSections.has(section) || 
        isNextIncompleteSection(section)) {
      setCurrentSection(section);
    }
  };

  // Helper to check if a section is the next incomplete one
  const isNextIncompleteSection = (section: FormSection): boolean => {
    const sectionValues = Object.values(FormSection);
    const targetIndex = sectionValues.indexOf(section);
    
    // Check if all sections before this one are completed
    for (let i = 0; i < targetIndex; i++) {
      if (!completedSections.has(sectionValues[i])) {
        return false;
      }
    }
    
    return !completedSections.has(section);
  };

  // Function to generate and download PDF
  // @ts-ignore - Temporarily ignore TypeScript errors as we implement PDF generation
  const generateRidsPdf = async (shouldDownload = true) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        return null;
      }
      
      toast.loading(shouldDownload ? 'Generating RIDS PDF...' : 'Previewing RIDS form...');
      
      const apiCompatibleData = transformRIDSFormDataForAPI(formData);
      
      // First validate the data with the API
      const response = await axios.post(
        '/api/personnel/rids/generate-pdf',
        { ridsData: apiCompatibleData }, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (!response.data.success) {
        toast.dismiss();
        toast.error(response.data.error || 'Failed to process data');
        return null;
      }
      
      toast.dismiss();
      
      // Using dynamic import for jsPDF to prevent server-side rendering issues
      const jsPDF = (await import('jspdf')).default;
      const { default: autoTable } = await import('jspdf-autotable');
      
      // Create new PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width || 210;
      const margin = 15;
      
      // Add header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RESERVIST INFORMATION DATA SHEET (RIDS)', pageWidth / 2, 20, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Current Y position tracker
      let yPos = 30;
      
      // Add Personal Information
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PERSONAL INFORMATION', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      yPos += 5;
      
      // Personal Info Table
      const personalInfo = apiCompatibleData.personalInformation || {};
      
      autoTable(doc, {
        startY: yPos,
        head: [['Field', 'Value']],
        body: [
          ['Name', `${formData.lastName}, ${formData.firstName} ${formData.middleName || ''}`],
          ['Rank', formData.rank || 'N/A'],
          ['AFPSN', apiCompatibleData.afpsn || 'N/A'],
          ['Date of Birth', personalInfo.dateOfBirth || 'N/A'],
          ['Place of Birth', personalInfo.placeOfBirth || 'N/A'],
          ['Gender', personalInfo.gender || 'N/A'],
          ['Civil Status', personalInfo.civilStatus || 'N/A'],
          ['Religion', personalInfo.religion || 'N/A'],
          ['Citizenship', personalInfo.citizenship || 'Filipino'],
          ['Blood Type', personalInfo.bloodType || 'N/A']
        ],
        theme: 'grid',
        tableWidth: pageWidth - (margin * 2),
        margin: { left: margin, right: margin }
      });
      
      // Get the Y position after the table
      // @ts-ignore
      yPos = doc.previousAutoTable.finalY + 10;
      
      // Add Contact Information
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CONTACT INFORMATION', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      yPos += 5;
      
      // Contact Info Table
      const contactInfo = apiCompatibleData.contactInformation || {};
      autoTable(doc, {
        startY: yPos,
        head: [['Field', 'Value']],
        body: [
          ['Residential Address', contactInfo.residentialAddress || 'N/A'],
          ['Mobile Number', contactInfo.mobileNumber || 'N/A'],
          ['Office Phone', contactInfo.officePhone || 'N/A'],
          ['Email Address', contactInfo.emailAddress || 'N/A']
        ],
        theme: 'grid',
        tableWidth: pageWidth - (margin * 2),
        margin: { left: margin, right: margin }
      });
      
      // @ts-ignore
      yPos = doc.previousAutoTable.finalY + 10;
      
      // Add Identification Information
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('IDENTIFICATION INFORMATION', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      yPos += 5;
      
      // ID Info Table
      const idInfo = apiCompatibleData.identificationInfo || {};
      autoTable(doc, {
        startY: yPos,
        head: [['Field', 'Value']],
        body: [
          ['Height', idInfo.height || 'N/A'],
          ['Weight', idInfo.weight || 'N/A'],
          ['SSS Number', idInfo.sssNumber || 'N/A'],
          ['TIN Number', idInfo.tinNumber || 'N/A'],
          ['PhilHealth Number', idInfo.philHealthNumber || 'N/A']
        ],
        theme: 'grid',
        tableWidth: pageWidth - (margin * 2),
        margin: { left: margin, right: margin }
      });
      
      // @ts-ignore
      yPos = doc.previousAutoTable.finalY + 10;
      
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Add Educational Background
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('EDUCATIONAL BACKGROUND', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      yPos += 5;
      
      // Education Info Table
      const educInfo = apiCompatibleData.educationalBackground || {};
      autoTable(doc, {
        startY: yPos,
        head: [['Field', 'Value']],
        body: [
          ['Highest Education', educInfo.highestEducation || 'N/A'],
          ['Course', educInfo.course || 'N/A'],
          ['School', educInfo.school || 'N/A'],
          ['Year Graduated', educInfo.yearGraduated || 'N/A']
        ],
        theme: 'grid',
        tableWidth: pageWidth - (margin * 2),
        margin: { left: margin, right: margin }
      });
      
      // @ts-ignore
      yPos = doc.previousAutoTable.finalY + 10;
      
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Add Occupation Information
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('OCCUPATION INFORMATION', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      yPos += 5;
      
      // Occupation Info Table
      const occInfo = apiCompatibleData.occupationInfo || {};
      autoTable(doc, {
        startY: yPos,
        head: [['Field', 'Value']],
        body: [
          ['Occupation', occInfo.occupation || 'N/A'],
          ['Employer', occInfo.employer || 'N/A'],
          ['Office Address', occInfo.officeAddress || 'N/A']
        ],
        theme: 'grid',
        tableWidth: pageWidth - (margin * 2),
        margin: { left: margin, right: margin }
      });
      
      // @ts-ignore
      yPos = doc.previousAutoTable.finalY + 10;
      
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Add Military Training
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('MILITARY TRAINING', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      yPos += 5;
      
      // Military Training Table
      if (Array.isArray(apiCompatibleData.militaryTraining) && apiCompatibleData.militaryTraining.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Training', 'Authority', 'Date Completed']],
          body: apiCompatibleData.militaryTraining.map(training => [
            training.name || 'N/A',
            training.authority || 'N/A',
            training.dateCompleted || 'N/A'
          ]),
          theme: 'grid',
          tableWidth: pageWidth - (margin * 2),
          margin: { left: margin, right: margin }
        });
      } else {
        autoTable(doc, {
          startY: yPos,
          body: [['No military training records']],
          theme: 'plain',
          tableWidth: pageWidth - (margin * 2),
          margin: { left: margin, right: margin }
        });
      }
      
      // Output the PDF
      const pdfBlob = doc.output('blob');
      const url = window.URL.createObjectURL(pdfBlob);
      
      if (shouldDownload) {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `RIDS_${formData.lastName}_${formData.firstName}.pdf`);
        
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        
        toast.success('RIDS PDF generated and downloaded successfully');
      } else {
        // Open the PDF in a new window for preview
        const newWindow = window.open(url, '_blank');
        
        // If popup was blocked, provide fallback
        if (!newWindow) {
          toast.error('Popup blocked. Please allow popups to preview the RIDS form.');
          return url; // Return URL so we can use it elsewhere
        }
        
        toast.success('RIDS form preview opened in a new window');
      }
      
      return url;
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss();
      toast.error(shouldDownload ? 'Failed to generate RIDS PDF' : 'Failed to preview RIDS form');
      return null;
    }
  };
  
  // Function to print the RIDS form
  const printRidsPdf = async () => {
    const url = await generateRidsPdf(false);
    if (url) {
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      } else {
        toast.error('Popup blocked. Please allow popups to print the RIDS form.');
      }
    }
  };

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const formErrors: Record<string, string> = {};
    if (!formData.afpsn)
      formErrors.serviceId = 'AFPSN (Service ID) is required';
    if (!formData.lastName) 
      formErrors.lastName = 'Last Name is required';
    if (!formData.firstName) 
      formErrors.firstName = 'First Name is required';
    
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      toast.error('Please fill all required fields.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Transform data for API submission
      const apiSubmitData = transformRIDSFormDataForAPI(formData);
      
      // Call API to create RIDS
      const response = await axios.post(
        '/api/personnel/rids/create',
        apiSubmitData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success('RIDS created successfully');
        await generateRidsPdf(); // Generate PDF with the form data
        router.push('/documents/rids');
      } else {
        toast.error(response.data.error || 'Failed to create RIDS');
      }
    } catch (error: any) {
      console.error('Error creating RIDS:', error);
      if (error.response?.data?.error) {
        toast.error(`Creation failed: ${error.response.data.error}`);
      } else if (error.response?.data?.message) {
        toast.error(`Creation failed: ${error.response.data.message}`);
      } else if (error.message) {
        toast.error(`Creation failed: ${error.message}`);
      } else {
        toast.error('Failed to create RIDS. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !['staff', 'admin', 'director'].includes(user.role)) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="mb-4 text-red-500">You don't have permission to access this page.</div>
        <Button variant="primary" onClick={() => router.push('/documents/rids')}>
          Return to RIDS Management
        </Button>
      </div>
    );
  }

  return (
    <div className="container p-4 mx-auto max-w-full">
      <div className="flex items-center mb-6">
        <Button
          variant="secondary"
          onClick={() => router.push('/documents/rids')}
          className="flex items-center mr-4"
        >
          <ArrowLeftIcon className="mr-1 w-5 h-5" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Create Reservist Information Data Sheet</h1>
      </div>

      {/* Information alert removed */}
      
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Left sidebar navigation - styled like DFA passport form */}
        <div className="flex-shrink-0 w-full md:w-72">
          <div className="overflow-hidden bg-white rounded-lg border border-gray-200">
            <div className="p-3 text-center text-white bg-blue-600 border-b border-gray-200">
              <h3 className="font-bold">Individual Appointment</h3>
            </div>
            
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {Object.values(FormSection).map((section) => {
                  // Use proper icons based on section type
                  let SectionIcon = UserIcon;
                  if (section === FormSection.PERSONAL_INFO) SectionIcon = UserIcon;
                  else if (section === FormSection.RESERVIST_PERSONNEL) SectionIcon = UserIcon;
                  else if (section === FormSection.PROMOTION) SectionIcon = ArrowUpIcon;
                  else if (section === FormSection.MILITARY) SectionIcon = Squares2X2Icon;
                  else if (section === FormSection.AWARDS) SectionIcon = TrophyIcon;
                  else if (section === FormSection.DEPENDENTS) SectionIcon = UsersIcon;
                  else if (section === FormSection.EDUCATIONAL) SectionIcon = AcademicCapIcon;
                  else if (section === FormSection.CAD_OJT_ADT) SectionIcon = BriefcaseIcon;
                  else if (section === FormSection.ASSIGNMENT) SectionIcon = ClipboardDocumentCheckIcon;
                  else if (section === FormSection.DESIGNATION) SectionIcon = BriefcaseIcon;
                  else if (section === FormSection.REVIEW) SectionIcon = DocumentTextIcon;
                  
                  return (
                    <li 
                      key={section}
                      className={`border-l-4 ${
                        section === currentSection 
                          ? 'border-l-blue-600 bg-blue-50' 
                          : completedSections.has(section)
                            ? 'border-l-green-500' 
                            : 'border-l-transparent'
                      }`}
                    >
                      <button
                        onClick={() => goToSection(section)}
                        disabled={!completedSections.has(section) && !isNextIncompleteSection(section)}
                        className={`w-full text-left px-4 py-3 flex items-center ${
                          section === currentSection 
                            ? 'text-blue-700 font-medium' 
                            : completedSections.has(section)
                              ? 'text-green-700' 
                              : 'text-gray-600'
                        } ${
                          !completedSections.has(section) && !isNextIncompleteSection(section) 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="mr-3 text-current">
                          {completedSections.has(section) ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          ) : (
                            <SectionIcon className="w-5 h-5" />
                          )}
                        </span>
                        <span>{section}</span>
                        {section === currentSection && (
                          <span className="ml-auto">
                            <ArrowRightIcon className="w-4 h-4" />
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
            
            <div className="p-3 text-xs text-center text-gray-600 bg-gray-50 border-t border-gray-200">
              Form Progress: {completedSections.size} of {Object.values(FormSection).length} Sections Complete
            </div>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex-grow">
          <div className="mb-6">
            <div className="p-3 text-white bg-blue-600 rounded-t-lg">
              <h2 className="font-bold">{currentSection}</h2>
            </div>
            
            <div className="p-6 bg-white rounded-b-lg border border-gray-200">
              {/* Section Content */}
              {sectionValidationErrors[currentSection]?.length > 0 && (
                <div className="p-3 mb-4 bg-red-50 rounded-md border border-red-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Please correct the following errors:</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <ul className="pl-5 space-y-1 list-disc">
                          {sectionValidationErrors[currentSection]?.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Render different form sections based on currentSection */}
              {currentSection === FormSection.RESERVIST_PERSONNEL && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Reservist Personnel Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Rank*</label>
                      <select
                        value={formData.rank} 
                        onChange={(e) => handleInputChange('rank', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Rank</option>
                        <option value="Private">Private</option>
                        <option value="Private First Class">Private First Class</option>
                        <option value="Corporal">Corporal</option>
                        <option value="Sergeant">Sergeant</option>
                        <option value="Second Lieutenant">Second Lieutenant</option>
                        <option value="First Lieutenant">First Lieutenant</option>
                        <option value="Captain">Captain</option>
                        <option value="Major">Major</option>
                        <option value="Lieutenant Colonel">Lieutenant Colonel</option>
                        <option value="Colonel">Colonel</option>
                        <option value="Brigadier General">Brigadier General</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Last Name*</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">First Name*</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Middle Name</label>
                      <input
                        type="text"
                        value={formData.middleName}
                        onChange={(e) => handleInputChange('middleName', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">AFPSN*</label>
                      <input
                        type="text"
                        value={formData.afpsn}
                        onChange={(e) => handleInputChange('afpsn', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">BrSVC</label>
                      <input
                        type="text"
                        value={formData.brSvc}
                        onChange={(e) => handleInputChange('brSvc', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 mt-6 border-t">
                    <h4 className="mb-2 font-medium text-gray-800">AFPOS / MOS</h4>
                    <div className="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-7">
                      {[
                        'INF', 'SC', 'AGS', 'GSC', 'CAV', 'QMS', 'FS', 'MNSA',
                        'FA', 'MI', 'RES'
                      ].map((option) => (
                        <label key={option} className="inline-flex items-center">
                          <input
                            type="radio"
                            name="afpos"
                            value={option}
                            checked={formData.afpos === option}
                            onChange={() => handleInputChange('afpos', option)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4 mt-2 border-t">
                    <h4 className="mb-2 font-medium text-gray-800">Source of Commission / Enlistment</h4>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7">
                      {[
                        'MNSA', 'MS-43', 'ROTC', 'CAA (CAFGU)', 
                        'ELECTED', 'POTC', 'CMT', 'MOT (PAARU)', 
                        'PRES APPOINTEE', 'CBT COMMISSION', 'BCMT',
                        'DEGREE HOLDER', 'EX-AFP', 'SBCMT'
                      ].map((option) => (
                        <label key={option} className="inline-flex items-center">
                          <input
                            type="radio"
                            name="sourceOfCommission"
                            value={option}
                            checked={formData.sourceOfCommission === option}
                            onChange={() => handleInputChange('sourceOfCommission', option)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 pt-4 mt-2 border-t md:grid-cols-3">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Initial Rank</label>
                      <input
                        type="text"
                        value={formData.initialRank}
                        onChange={(e) => handleInputChange('initialRank', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Date of Commission/Enlistment</label>
                      <input
                        type="date"
                        value={formData.dateOfComsnEnlist}
                        onChange={(e) => handleInputChange('dateOfComsnEnlist', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Authority</label>
                      <input
                        type="text"
                        value={formData.authority}
                        onChange={(e) => handleInputChange('authority', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 pt-4 mt-2 border-t md:grid-cols-2">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Reservist Classification</label>
                      <div className="flex gap-4">
                        {['READY', 'STANDBY', 'RETIRED'].map((option) => (
                          <label key={option} className="inline-flex items-center">
                            <input
                              type="radio"
                              name="reservistClassification"
                              value={option}
                              checked={formData.reservistClassification === option}
                              onChange={() => handleInputChange('reservistClassification', option)}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Mobilization Center</label>
                      <input
                        type="text"
                        value={formData.mobilizationCenter}
                        onChange={(e) => handleInputChange('mobilizationCenter', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 pt-4 mt-2 border-t md:grid-cols-3">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Designation</label>
                      <input
                        type="text"
                        value={formData.designation}
                        onChange={(e) => handleInputChange('designation', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Squad/Team/Section</label>
                      <input
                        type="text"
                        value={formData.squad}
                        onChange={(e) => handleInputChange('squad', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Platoon</label>
                      <input
                        type="text"
                        value={formData.platoon}
                        onChange={(e) => handleInputChange('platoon', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Company</label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Battalion/Brigade/Division</label>
                      <input
                        type="text"
                        value={formData.battalion}
                        onChange={(e) => handleInputChange('battalion', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 pt-4 mt-2 border-t md:grid-cols-3">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Size of Combat Shoes</label>
                      <input
                        type="text"
                        value={formData.sizeOfCombatShoes}
                        onChange={(e) => handleInputChange('sizeOfCombatShoes', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Size of Cap (cm)</label>
                      <input
                        type="text"
                        value={formData.sizeOfCap}
                        onChange={(e) => handleInputChange('sizeOfCap', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Size of BDA</label>
                      <input
                        type="text"
                        value={formData.sizeOfBDA}
                        onChange={(e) => handleInputChange('sizeOfBDA', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentSection === FormSection.PERSONAL_INFO && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <label className="block mb-1 text-sm font-medium text-gray-700">Present Occupation</label>
                      <input
                        type="text"
                        value={formData.presentOccupation}
                        onChange={(e) => handleInputChange('presentOccupation', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Office Tel Nr</label>
                      <input
                        type="tel"
                        value={formData.officeTelNr}
                        onChange={(e) => handleInputChange('officeTelNr', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block mb-1 text-sm font-medium text-gray-700">Company Name & Address</label>
                      <input
                        type="text"
                        value={formData.companyNameAddress}
                        onChange={(e) => handleInputChange('companyNameAddress', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Res.Tel.Nr</label>
                      <input
                        type="tel"
                        value={formData.resTelNr}
                        onChange={(e) => handleInputChange('resTelNr', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block mb-1 text-sm font-medium text-gray-700">Home Address: Street/Barangay*</label>
                      <input
                        type="text"
                        value={formData.homeAddress}
                        onChange={(e) => handleInputChange('homeAddress', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block mb-1 text-sm font-medium text-gray-700">Town/City/Province/ZIP Code*</label>
                      <input
                        type="text"
                        value={formData.townCityProvinceZip}
                        onChange={(e) => handleInputChange('townCityProvinceZip', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Mobile Tel Nr*</label>
                      <input
                        type="tel"
                        value={formData.mobileTelNr}
                        onChange={(e) => handleInputChange('mobileTelNr', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Birthdate* (dd-mm-yyyy)</label>
                      <input
                        type="date"
                        value={formData.birthdate}
                        onChange={(e) => handleInputChange('birthdate', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block mb-1 text-sm font-medium text-gray-700">Birth Place (Municipality, Province)*</label>
                      <input
                        type="text"
                        value={formData.birthPlace}
                        onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Age</label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => handleInputChange('age', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Religion</label>
                      <input
                        type="text"
                        value={formData.religion}
                        onChange={(e) => handleInputChange('religion', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Blood Type</label>
                      <select
                        value={formData.bloodType}
                        onChange={(e) => handleInputChange('bloodType', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Blood Type</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">T.I.N.</label>
                      <input
                        type="text"
                        value={formData.tin}
                        onChange={(e) => handleInputChange('tin', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">SSS Nr:</label>
                      <input
                        type="text"
                        value={formData.sssNr}
                        onChange={(e) => handleInputChange('sssNr', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">PHILHEALTH Nr:</label>
                      <input
                        type="text"
                        value={formData.philhealthNr}
                        onChange={(e) => handleInputChange('philhealthNr', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Height: cm</label>
                      <input
                        type="text"
                        value={formData.height}
                        onChange={(e) => handleInputChange('height', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Weight: kgs</label>
                      <input
                        type="text"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Marital Status</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Single', 'Married', 'Widow', 'Separated'].map((option) => (
                          <label key={option} className="inline-flex items-center">
                            <input
                              type="radio"
                              name="maritalStatus"
                              value={option}
                              checked={formData.maritalStatus === option}
                              onChange={() => handleInputChange('maritalStatus', option)}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Sex</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Male', 'Female'].map((option) => (
                          <label key={option} className="inline-flex items-center">
                            <input
                              type="radio"
                              name="sex"
                              value={option}
                              checked={formData.sex === option}
                              onChange={() => handleInputChange('sex', option)}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">FB Account:</label>
                      <input
                        type="text"
                        value={formData.fbAccount}
                        onChange={(e) => handleInputChange('fbAccount', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Email Address:</label>
                      <input
                        type="email"
                        value={formData.emailAddress}
                        onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Special Skills:</label>
                      <input
                        type="text"
                        value={formData.specialSkills}
                        onChange={(e) => handleInputChange('specialSkills', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Language/Dialect Spoken:</label>
                      <input
                        type="text"
                        value={formData.languageDialect}
                        onChange={(e) => handleInputChange('languageDialect', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {currentSection === FormSection.PROMOTION && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Promotion/Demotion</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 text-left border text-black font-semibold">Rank</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">Date of Rank</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">Authority</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.promotions.map((promotion, index) => (
                          <tr key={index}>
                            <td className="p-2 border">
                              <input
                                type="text"
                                value={promotion.rank}
                                onChange={(e) => handleArrayChange('promotions', index, 'rank', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <input
                                type="date"
                                value={promotion.date}
                                onChange={(e) => handleArrayChange('promotions', index, 'date', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <input
                                type="text"
                                value={promotion.authority}
                                onChange={(e) => handleArrayChange('promotions', index, 'authority', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <button
                                type="button"
                                onClick={() => {
                                  const newPromotions = [...formData.promotions];
                                  newPromotions.splice(index, 1);
                                  setFormData({ ...formData, promotions: newPromotions });
                                }}
                                className="px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => addArrayItem('promotions', { rank: '', date: '', authority: '' })}
                      className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                    >
                      Add Promotion/Demotion
                    </button>
                  </div>
                </div>
              )}
              
              {currentSection === FormSection.MILITARY && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Military Training/Seminar/Schooling</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 text-left border text-black font-semibold">Military Schooling</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">School</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">Date Graduated</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.militaryTraining.map((training, index) => (
                          <tr key={index}>
                            <td className="p-2 border">
                              <input
                                type="text"
                                value={training.schooling}
                                onChange={(e) => handleArrayChange('militaryTraining', index, 'schooling', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <input
                                type="text"
                                value={training.school}
                                onChange={(e) => handleArrayChange('militaryTraining', index, 'school', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <input
                                type="date"
                                value={training.dateGraduated}
                                onChange={(e) => handleArrayChange('militaryTraining', index, 'dateGraduated', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <button
                                type="button"
                                onClick={() => {
                                  const newTrainings = [...formData.militaryTraining];
                                  newTrainings.splice(index, 1);
                                  setFormData({ ...formData, militaryTraining: newTrainings });
                                }}
                                className="px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => addArrayItem('militaryTraining', { schooling: '', school: '', dateGraduated: '' })}
                      className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                    >
                      Add Military Training
                    </button>
                  </div>
                </div>
              )}
              
              {currentSection === FormSection.AWARDS && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Awards and Decoration</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 text-left border text-black font-semibold">Awards/Decoration</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">Authority</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">Date Awarded</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.awards.map((award, index) => (
                          <tr key={index}>
                            <td className="p-2 border">
                              <input
                                type="text"
                                value={award.award}
                                onChange={(e) => handleArrayChange('awards', index, 'award', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <input
                                type="text"
                                value={award.authority}
                                onChange={(e) => handleArrayChange('awards', index, 'authority', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <input
                                type="date"
                                value={award.dateAwarded}
                                onChange={(e) => handleArrayChange('awards', index, 'dateAwarded', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <button
                                type="button"
                                onClick={() => {
                                  const newAwards = [...formData.awards];
                                  newAwards.splice(index, 1);
                                  setFormData({ ...formData, awards: newAwards });
                                }}
                                className="px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => addArrayItem('awards', { award: '', authority: '', dateAwarded: '' })}
                      className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                    >
                      Add Award
                    </button>
                  </div>
                </div>
              )}
              
              {currentSection === FormSection.DEPENDENTS && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Dependents Information</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 text-left border text-black font-semibold">Relation</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">Name</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.dependents.map((dependent, index) => (
                          <tr key={index}>
                            <td className="p-2 border">
                              <input
                                type="text"
                                value={dependent.relation}
                                onChange={(e) => handleArrayChange('dependents', index, 'relation', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <input
                                type="text"
                                value={dependent.name}
                                onChange={(e) => handleArrayChange('dependents', index, 'name', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <button
                                type="button"
                                onClick={() => {
                                  const newDependents = [...formData.dependents];
                                  newDependents.splice(index, 1);
                                  setFormData({ ...formData, dependents: newDependents });
                                }}
                                className="px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => addArrayItem('dependents', { relation: '', name: '' })}
                      className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                    >
                      Add Dependent
                    </button>
                  </div>
                </div>
              )}
              
              {currentSection === FormSection.EDUCATIONAL && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Highest Educational Attainment</h3>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Course</label>
                      <input
                        type="text"
                        value={formData.education.course}
                        onChange={(e) => handleEducationChange('course', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">School</label>
                      <input
                        type="text"
                        value={formData.education.school}
                        onChange={(e) => handleEducationChange('school', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Date Graduated</label>
                      <input
                        type="date"
                        value={formData.education.dateGraduated}
                        onChange={(e) => handleEducationChange('dateGraduated', e.target.value)}
                        className="p-2 w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {currentSection === FormSection.CAD_OJT_ADT && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">CAD/OJT/ADT</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 text-left border text-black font-semibold">Unit</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">Purpose / Authority</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">Date Start</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">Date End</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.cadOjt.map((cad, index) => (
                          <tr key={index}>
                            <td className="p-2 border">
                              <input
                                type="text"
                                value={cad.unit}
                                onChange={(e) => handleArrayChange('cadOjt', index, 'unit', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <input
                                type="text"
                                value={cad.purpose}
                                onChange={(e) => handleArrayChange('cadOjt', index, 'purpose', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <input
                                type="date"
                                value={cad.dateStart}
                                onChange={(e) => handleArrayChange('cadOjt', index, 'dateStart', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <input
                                type="date"
                                value={cad.dateEnd}
                                onChange={(e) => handleArrayChange('cadOjt', index, 'dateEnd', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <button
                                type="button"
                                onClick={() => {
                                  const newCadOjt = [...formData.cadOjt];
                                  newCadOjt.splice(index, 1);
                                  setFormData({ ...formData, cadOjt: newCadOjt });
                                }}
                                className="px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => addArrayItem('cadOjt', { unit: '', purpose: '', dateStart: '', dateEnd: '' })}
                      className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                    >
                      Add CAD/OJT/ADT
                    </button>
                  </div>
                </div>
              )}
              
              {currentSection === FormSection.ASSIGNMENT && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Unit Assignment</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 text-left border text-black font-semibold">Unit</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">Authority</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">Date From</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">Date To</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.unitAssignment.map((assignment, index) => (
                          <tr key={index}>
                            <td className="p-2 border">
                              <input
                                type="text"
                                value={assignment.unit}
                                onChange={(e) => handleArrayChange('unitAssignment', index, 'unit', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <input
                                type="text"
                                value={assignment.authority}
                                onChange={(e) => handleArrayChange('unitAssignment', index, 'authority', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <input
                                type="date"
                                value={assignment.dateFrom}
                                onChange={(e) => handleArrayChange('unitAssignment', index, 'dateFrom', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <input
                                type="date"
                                value={assignment.dateTo}
                                onChange={(e) => handleArrayChange('unitAssignment', index, 'dateTo', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <button
                                type="button"
                                onClick={() => {
                                  const newAssignments = [...formData.unitAssignment];
                                  newAssignments.splice(index, 1);
                                  setFormData({ ...formData, unitAssignment: newAssignments });
                                }}
                                className="px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => addArrayItem('unitAssignment', { unit: '', authority: '', dateFrom: '', dateTo: '' })}
                      className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                    >
                      Add Unit Assignment
                    </button>
                  </div>
                </div>
              )}
              
              {currentSection === FormSection.DESIGNATION && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Designation</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 text-left border text-black font-semibold">Position</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">Authority</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">Date From</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">Date To</th>
                          <th className="px-4 py-2 text-left border text-black font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.designationTable.map((designation, index) => (
                          <tr key={index}>
                            <td className="p-2 border">
                              <input
                                type="text"
                                value={designation.position}
                                onChange={(e) => handleArrayChange('designationTable', index, 'position', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <input
                                type="text"
                                value={designation.authority}
                                onChange={(e) => handleArrayChange('designationTable', index, 'authority', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <input
                                type="date"
                                value={designation.dateFrom}
                                onChange={(e) => handleArrayChange('designationTable', index, 'dateFrom', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <input
                                type="date"
                                value={designation.dateTo}
                                onChange={(e) => handleArrayChange('designationTable', index, 'dateTo', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-2 border">
                              <button
                                type="button"
                                onClick={() => {
                                  const newDesignations = [...formData.designationTable];
                                  newDesignations.splice(index, 1);
                                  setFormData({ ...formData, designationTable: newDesignations });
                                }}
                                className="px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => addArrayItem('designationTable', { position: '', authority: '', dateFrom: '', dateTo: '' })}
                      className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                    >
                      Add Designation
                    </button>
                  </div>
                </div>
              )}
              
              {currentSection === FormSection.REVIEW && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800">Review Information</h3>
                  <p className="text-gray-600">Please review all information before submitting the RIDS form.</p>
                  
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="mb-3 font-medium text-gray-800">Reservist Personnel Information</h4>
                      <div className="space-y-2">
                        <p className="text-gray-700"><span className="font-medium text-gray-800">Rank:</span> {formData.rank || 'Not specified'}</p>
                        <p className="text-gray-700"><span className="font-medium text-gray-800">Name:</span> {formData.lastName}, {formData.firstName} {formData.middleName}</p>
                        <p className="text-gray-700"><span className="font-medium text-gray-800">AFPSN:</span> {formData.afpsn || 'Not specified'}</p>
                        <p className="text-gray-700"><span className="font-medium text-gray-800">BrSVC:</span> {formData.brSvc || 'Not specified'}</p>
                        <p className="text-gray-700"><span className="font-medium text-gray-800">Source of Commission:</span> {formData.sourceOfCommission || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="mb-3 font-medium text-gray-800">Personal Information</h4>
                      <div className="space-y-2">
                        <p className="text-gray-700"><span className="font-medium text-gray-800">Address:</span> {formData.homeAddress}, {formData.townCityProvinceZip}</p>
                        <p className="text-gray-700"><span className="font-medium text-gray-800">Mobile:</span> {formData.mobileTelNr || 'Not specified'}</p>
                        <p className="text-gray-700"><span className="font-medium text-gray-800">Email:</span> {formData.emailAddress || 'Not specified'}</p>
                        <p className="text-gray-700"><span className="font-medium text-gray-800">Birthdate:</span> {formData.birthdate || 'Not specified'}</p>
                        <p className="text-gray-700"><span className="font-medium text-gray-800">Sex:</span> {formData.sex || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="mb-3 font-medium text-gray-800">Personal Details</h4>
                      <div className="space-y-2">
                        <p className="text-gray-700"><span className="font-medium text-gray-800">Height:</span> {formData.height || 'Not specified'} cm</p>
                        <p className="text-gray-700"><span className="font-medium text-gray-800">Weight:</span> {formData.weight || 'Not specified'} kg</p>
                        <p className="text-gray-700"><span className="font-medium text-gray-800">Blood Type:</span> {formData.bloodType || 'Not specified'}</p>
                        <p className="text-gray-700"><span className="font-medium text-gray-800">Religion:</span> {formData.religion || 'Not specified'}</p>
                        <p className="text-gray-700"><span className="font-medium text-gray-800">Civil Status:</span> {formData.maritalStatus || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="mb-3 font-medium text-gray-800">Promotion History</h4>
                      {formData.promotions.length > 0 ? (
                        <ul className="space-y-2">
                          {formData.promotions.map((promotion, index) => (
                            <li key={index} className="text-gray-700">
                              {promotion.rank || 'Rank not specified'} - {promotion.date || 'Date not specified'}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No promotion records added.</p>
                      )}
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="mb-3 font-medium text-gray-800">Military Training</h4>
                      {formData.militaryTraining.length > 0 ? (
                        <ul className="space-y-2">
                          {formData.militaryTraining.map((training, index) => (
                            <li key={index} className="text-gray-700">
                              {training.schooling || 'Training not specified'} - {training.school || 'School not specified'}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No military training records added.</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col p-4 bg-blue-50 rounded-md border border-blue-300">
                    <h4 className="mb-2 text-center font-medium text-blue-800">Ready to Submit</h4>
                    <p className="mb-4 text-center text-blue-700">
                      Before submitting, you can preview or print the RIDS form.
                      By clicking "Submit & Download", you certify that all provided information is correct and accurate.
                    </p>
                    
                    <div className="flex justify-center space-x-4">
                      <button
                        type="button"
                        onClick={() => generateRidsPdf(false)}
                        className="px-4 py-2 text-sm flex items-center text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50"
                      >
                        <EyeIcon className="w-5 h-5 mr-1" />
                        View Form
                      </button>
                      <button
                        type="button"
                        onClick={printRidsPdf}
                        className="px-4 py-2 text-sm flex items-center text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50"
                      >
                        <PrinterIcon className="w-5 h-5 mr-1" />
                        Print Form
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
                            {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                {currentSection === FormSection.RESERVIST_PERSONNEL ? (
                  <div></div> // Empty div to maintain spacing when no Previous button
                ) : (
          <Button
            variant="secondary"
                    onClick={goToPreviousSection}
                    className="flex items-center"
          >
                    <ArrowLeftIcon className="mr-1 w-4 h-4" />
                    Previous
          </Button>
                )}
                
                {currentSection === FormSection.REVIEW ? (
          <Button
            variant="primary"
                    onClick={handleSubmit}
            disabled={isSubmitting}
                    className="flex items-center"
          >
                    {isSubmitting ? 'Submitting...' : 'Submit & Download'}
                    <DocumentTextIcon className="ml-1 w-4 h-4" />
          </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={goToNextSection}
                    className="flex items-center"
                  >
                    Next
                    <ArrowRightIcon className="ml-1 w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 