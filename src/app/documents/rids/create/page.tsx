"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/Button';
import { ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
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

// Helper function to transform formData from RIDSForm to RIDSData for API
const transformRIDSFormDataForAPI = (formData: any): Partial<RIDSData> => {
  return {
    // --- Reservist Personnel Information from RIDSForm top section ---
    rank: formData.rank,
    lastName: formData.lastName,
    firstName: formData.firstName,
    middleName: formData.middleName,
    afpsn: formData.afpsn, // Maps to identificationInfo.serviceId as well
    brsvc: formData.brSvc,
    // afpos: formData.afpos, // How to map checkbox group?
    sourceOfCommission: formData.sourceOfCommission, // How to map checkbox group?
    initialRank: formData.initialRank,
    dateOfComsnEnlist: formData.dateOfComsnEnlist,
    commissionAuthority: formData.authority, // Authority for commission
    reservistClassification: formData.reservistClassification,
    mobilizationCenter: formData.mobilizationCenter,
    unitDesignation: formData.designation, // Designation from top section
    squadTeamSection: formData.squad,
    platoon: formData.platoon,
    company: formData.company,
    battalionBrigadeDivision: formData.battalion,
    sizeOfCombatShoes: formData.sizeOfCombatShoes,
    sizeOfCap: formData.sizeOfCap,
    sizeOfBDU: formData.sizeOfBDA, // Assuming BDA in form means BDU for API

    // --- Personal Information ---
    personalInformation: {
      fullName: `${formData.lastName}, ${formData.firstName} ${formData.middleName || ''}`.trim(),
      dateOfBirth: formData.birthdate,
      placeOfBirth: formData.birthPlace,
      gender: formData.sex,
      civilStatus: formData.maritalStatus,
      religion: formData.religion,
      citizenship: 'Filipino', // Default or from form if added
      bloodType: formData.bloodType,
    },
    contactInformation: {
      residentialAddress: `${formData.homeAddress} ${formData.townCityProvinceZip || ''}`.trim(),
      mobileNumber: formData.mobileTelNr,
      officePhone: formData.officeTelNr,
      emailAddress: formData.emailAddress,
    },
    identificationInfo: {
      serviceId: formData.afpsn, // AFPSN from form
      height: formData.height,
      weight: formData.weight,
      sssNumber: formData.sssNr,
      tinNumber: formData.tin,
      philHealthNumber: formData.philhealthNr,
    },
    // --- Educational Background ---
    educationalBackground: {
      // Assuming 'Course' field in RIDSForm.education is the primary detail.
      // 'highestEducation' in API might need a mapping from 'Course' if it expects a level (e.g., College, Post Grad)
      highestEducation: formData.education.course || 'N/A', 
      course: formData.education.course,
      school: formData.education.school,
      yearGraduated: formData.education.dateGraduated,
    },
    // --- Occupation Info ---
    occupationInfo: {
      occupation: formData.presentOccupation,
      officeAddress: formData.companyNameAddress, // Company Name & Address
    },
    // --- Military Training --- 
    // API expects: name, authority, dateCompleted
    // RIDSForm provides: schooling, school, dateGraduated
    // Needs careful mapping for 'authority' and 'name' vs 'schooling'/'school'
    militaryTraining: formData.militaryTraining.map((mt: any) => ({
      name: mt.schooling, // Or mt.school, depending on what 'name' means in API
      school: mt.school, // This might be redundant if 'name' is school, or could be training name
      authority: 'N/A', // Placeholder - RIDSForm.militaryTraining does not have 'authority'
      dateCompleted: mt.dateGraduated,
    })),
    // --- Special Skills ---
    // RIDSForm.specialSkills is a string. API expects string[]. Assuming comma-separated if multiple.
    specialSkills: formData.specialSkills ? formData.specialSkills.split(',').map((s:string) => s.trim()) : [],
    // --- Awards ---
    // API: title, authority, dateAwarded
    // RIDSForm: award, authority, dateAwarded - direct mapping
    awards: formData.awards.map((aw: any) => ({
      title: aw.award,
      authority: aw.authority,
      dateAwarded: aw.dateAwarded,
    })),
    // --- Dependents ---
    dependents: formData.dependents.map((dep: any) => ({
      relation: dep.relation,
      name: dep.name,
    })),
    // --- Assignments (Unit Assignment in RIDSForm) ---
    // API: unitName, authority, dateFrom, dateTo
    // RIDSForm: unit, authority, dateFrom, dateTo - direct mapping
    assignments: formData.unitAssignment.map((ua: any) => ({
      unitName: ua.unit, // Renamed from 'unit' to 'unitName' for clarity if API expects that
      authority: ua.authority,
      dateFrom: ua.dateFrom,
      dateTo: ua.dateTo,
    })),
    // Note: CAD/OJT/ADT and DESIGNATION (table) from RIDSForm are not in the RIDSData interface.
    // If they need to be submitted, RIDSData interface and this transformation must be updated.
  };
};

export default function CreateRIDSPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const ridsFormRef = useRef<any>(null); // Ref for RIDSForm component

  // Function to generate and download PDF
  const generateRidsPdf = async () => {
    if (!ridsFormRef.current) {
      toast.error('Form reference is not available.');
      return;
    }
    const currentFormData = ridsFormRef.current.getFormData();
    const apiCompatibleData = transformRIDSFormDataForAPI(currentFormData);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      toast.loading('Generating RIDS PDF...');
      
      const response = await axios.post(
        '/api/personnel/rids/generate-pdf',
        // Send the transformed data
        { ridsData: apiCompatibleData }, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          responseType: 'blob' 
        }
      );
      
      toast.dismiss();
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      // Use names from the form for the PDF filename
      link.setAttribute('download', `RIDS_${currentFormData.lastName}_${currentFormData.firstName}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      
      toast.success('RIDS PDF generated and downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss();
      toast.error('Failed to generate RIDS PDF');
    }
  };

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ridsFormRef.current) {
      toast.error('Form reference is not available.');
      return;
    }
    const currentFormData = ridsFormRef.current.getFormData();

    // Validate form (using data from RIDSForm)
    const formErrors: Record<string, string> = {};
    if (!currentFormData.afpsn) // AFPSN in RIDSForm corresponds to serviceId
      formErrors.serviceId = 'AFPSN (Service ID) is required';
    if (!currentFormData.lastName) 
      formErrors.lastName = 'Last Name is required';
    if (!currentFormData.firstName) 
      formErrors.firstName = 'First Name is required';
    
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors); // Still show errors on this page for now
      // Optionally, you could pass a setError prop to RIDSForm to show errors inline
      toast.error('Please fill all required fields.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Transform data for API submission
      const apiSubmitData = transformRIDSFormDataForAPI(currentFormData);
      
      // Call API to create RIDS
      const response = await axios.post(
        '/api/personnel/rids/create',
        apiSubmitData, // Send the transformed data
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success('RIDS created successfully');
        await generateRidsPdf(); // Generate PDF with the same form data
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !['staff', 'admin', 'director'].includes(user.role)) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="text-red-500 mb-4">You don't have permission to access this page.</div>
        <Button variant="primary" onClick={() => router.push('/documents/rids')}>
          Return to RIDS Management
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button
          variant="secondary"
          onClick={() => router.push('/documents/rids')}
          className="flex items-center mr-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Create Reservist Information Data Sheet</h1>
      </div>

      {/* Render RIDSForm and pass the ref */}
      <RIDSForm ref={ridsFormRef} />

      {/* Form submission buttons are now part of this page, not RIDSForm */}
      {/* This allows page.tsx to control submission logic */}
      <form onSubmit={handleSubmit} className="mt-6 flex justify-end space-x-4">
          <Button
            variant="secondary"
            type="button"
            onClick={() => router.push('/documents/rids')}
            className="text-gray-900"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create & Download RIDS'}
          </Button>
        </form>
        {/* Display errors from page-level validation */}
        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-4 border border-red-300 bg-red-50 rounded-md">
            <h3 className="text-sm font-medium text-red-800">Please correct the following errors:</h3>
            <ul className="list-disc list-inside text-sm text-red-700 mt-2">
              {Object.entries(errors).map(([key, value]) => (
                <li key={key}>{value}</li>
              ))}
            </ul>
          </div>
        )}
    </div>
  );
} 