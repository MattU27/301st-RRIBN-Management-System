"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { 
  UserIcon, 
  BuildingOfficeIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import axios from 'axios';

// Define interfaces (copied from the main page)
interface Reservist {
  id: string;
  name: string;
  rank: string;
  serviceNumber: string;
  email: string;
  status: string;
  company: string;
  dateJoined: string;
  lastUpdated: string;
  ridsData?: RIDSData;
  ridsStatus: 'complete' | 'incomplete' | 'pending_verification' | 'verified';
  isRegistrationComplete?: boolean;
}

interface RIDSData {
  personalInformation: {
    fullName: string;
    dateOfBirth: string;
    placeOfBirth: string;
    gender: string;
    civilStatus: string;
    religion: string;
    citizenship: string;
    bloodType: string;
  };
  contactInformation: {
    residentialAddress: string;
    mobileNumber: string;
    officePhone?: string;
    emailAddress: string;
  };
  identificationInfo: {
    serviceId: string;
    height: string;
    weight: string;
    sssNumber?: string;
    tinNumber?: string;
    philHealthNumber?: string;
    pagIbigNumber?: string;
  };
  educationalBackground: {
    highestEducation: string;
    course?: string;
    school: string;
    yearGraduated: string;
  };
  occupationInfo: {
    occupation: string;
    employer?: string;
    officeAddress?: string;
  };
  militaryTraining: {
    name: string;
    authority: string;
    dateCompleted: string;
  }[];
  specialSkills: string[];
  awards: {
    title: string;
    authority: string;
    dateAwarded: string;
  }[];
  assignments: {
    authority: string;
    dateFrom: string;
    dateTo: string;
  }[];
  filePath?: string; // Path to the uploaded PDF file
}

export default function ViewRIDS({ params }: { params: { id: string } }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [reservist, setReservist] = useState<Reservist | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && user && (['staff', 'admin', 'director', 'administrator'].includes(user.role))) {
      fetchReservist();
    }
  }, [isLoading, isAuthenticated, router, user, params.id]);

  const fetchReservist = async () => {
    try {
      setIsLoadingData(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`/api/personnel/reservist/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        params: {
          _t: new Date().getTime(),
        }
      });

      if (response.data.success) {
        setReservist(response.data.data.reservist);
      } else {
        toast.error('Failed to load reservist details');
        router.push('/documents/rids');
      }
    } catch (error) {
      console.error('Error fetching reservist:', error);
      toast.error('Failed to load reservist details');
      router.push('/documents/rids');
    } finally {
      setIsLoadingData(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Verified
          </span>
        );
      case 'pending_verification':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-200 text-yellow-900">
            <ClockIcon className="h-4 w-4 mr-1" />
            Pending Verification
          </span>
        );
      case 'incomplete':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-4 w-4 mr-1" />
            Incomplete
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const handleVerifyRIDS = async (isApproved: boolean) => {
    if (!reservist) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.post(
        '/api/personnel/rids/verify',
        { 
          reservistId: reservist.id,
          isApproved,
          reason: isApproved ? undefined : 'Please update your information and resubmit'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(isApproved ? 'RIDS verified successfully' : 'RIDS rejected');
        fetchReservist(); // Refresh data
      } else {
        toast.error('Failed to update RIDS status');
      }
    } catch (error) {
      console.error('Error updating RIDS status:', error);
      toast.error('Failed to update RIDS status');
    }
  };

  // Add a function to determine if the user can manage (verify) RIDS
  const canManageRIDS = () => {
    return user && ['staff', 'admin', 'director'].includes(user.role);
  };

  // Check if user is administrator
  const isAdministrator = () => {
    return user && user.role === 'administrator';
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!reservist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Reservist Not Found</h2>
          <p className="text-gray-600 mb-6">The reservist information you are looking for could not be found.</p>
          <Button
            variant="primary"
            onClick={() => router.push('/documents/rids')}
            className="flex items-center mx-auto"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to RIDS Management
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Button
            variant="secondary"
            onClick={() => router.push('/documents/rids')}
            className="mr-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Reservist Information Data Sheet</h1>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={fetchReservist}
            className="flex items-center"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Refresh
          </Button>
          {reservist.ridsData?.filePath && (
            <Button
              variant="primary"
              onClick={() => window.open(reservist.ridsData?.filePath, '_blank')}
              className="flex items-center"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              View Original PDF
            </Button>
          )}
        </div>
      </div>

      <Card>
        <div className="p-6">
          {/* Reservist Header Information */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div className="mb-4 md:mb-0">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <UserIcon className="h-6 w-6 mr-2 text-indigo-600" />
                  {reservist.name}
                </h2>
                <p className="text-gray-600 mt-1 flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 mr-2 text-gray-500" />
                  {reservist.company} • {reservist.rank}
                </p>
              </div>
              <div className="flex flex-col items-start md:items-end">
                <div className="mb-2">{getStatusBadge(reservist.ridsStatus)}</div>
                <p className="text-sm text-gray-600">
                  Service ID: <span className="font-semibold">{reservist.serviceNumber}</span>
                </p>
              </div>
            </div>
          </div>

          {/* RIDS Verification Actions (if pending verification AND user can manage RIDS) */}
          {reservist.ridsStatus === 'pending_verification' && canManageRIDS() && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-start mb-4 md:mb-0">
                  <InformationCircleIcon className="h-6 w-6 text-yellow-500 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Pending Verification</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      This RIDS is awaiting your verification. Please review the information and approve or reject it.
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="success"
                    onClick={() => handleVerifyRIDS(true)}
                    className="flex items-center"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleVerifyRIDS(false)}
                    className="flex items-center"
                  >
                    <XCircleIcon className="h-5 w-5 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Special message for administrators when a document needs verification */}
          {reservist.ridsStatus === 'pending_verification' && isAdministrator() && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <InformationCircleIcon className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Pending Verification</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    This RIDS is awaiting verification by a staff member or administrator with verification privileges.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!reservist.ridsData ? (
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <div className="flex items-start">
                <XCircleIcon className="h-6 w-6 text-red-500 mr-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">No RIDS Data Available</h3>
                  <p className="text-sm text-red-700 mt-1">
                    This reservist doesn't have any RIDS data available. They may need to complete their information.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-gray-500">Full Name</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {reservist.ridsData.personalInformation.fullName}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Date of Birth</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {reservist.ridsData.personalInformation.dateOfBirth}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Place of Birth</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {reservist.ridsData.personalInformation.placeOfBirth}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Gender</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {reservist.ridsData.personalInformation.gender}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Civil Status</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {reservist.ridsData.personalInformation.civilStatus}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Religion</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {reservist.ridsData.personalInformation.religion}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Citizenship</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {reservist.ridsData.personalInformation.citizenship}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Blood Type</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {reservist.ridsData.personalInformation.bloodType}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-500">Residential Address</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {reservist.ridsData.contactInformation.residentialAddress}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Mobile Number</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {reservist.ridsData.contactInformation.mobileNumber}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Email Address</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {reservist.ridsData.contactInformation.emailAddress}
                    </div>
                  </div>
                  {reservist.ridsData.contactInformation.officePhone && (
                    <div>
                      <div className="text-sm text-gray-500">Office Phone</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {reservist.ridsData.contactInformation.officePhone}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Identification Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Identification Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-gray-500">Service ID</div>
                    <div className="mt-1 text-sm font-medium text-indigo-700">
                      {reservist.ridsData.identificationInfo.serviceId}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Height</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {reservist.ridsData.identificationInfo.height}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Weight</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {reservist.ridsData.identificationInfo.weight}
                    </div>
                  </div>
                  {reservist.ridsData.identificationInfo.sssNumber && (
                    <div>
                      <div className="text-sm text-gray-500">SSS Number</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {reservist.ridsData.identificationInfo.sssNumber}
                      </div>
                    </div>
                  )}
                  {reservist.ridsData.identificationInfo.tinNumber && (
                    <div>
                      <div className="text-sm text-gray-500">TIN Number</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {reservist.ridsData.identificationInfo.tinNumber}
                      </div>
                    </div>
                  )}
                  {reservist.ridsData.identificationInfo.philHealthNumber && (
                    <div>
                      <div className="text-sm text-gray-500">PhilHealth Number</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {reservist.ridsData.identificationInfo.philHealthNumber}
                      </div>
                    </div>
                  )}
                  {reservist.ridsData.identificationInfo.pagIbigNumber && (
                    <div>
                      <div className="text-sm text-gray-500">Pag-IBIG Number</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {reservist.ridsData.identificationInfo.pagIbigNumber}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Educational Background */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Educational Background
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-500">Highest Education</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {reservist.ridsData.educationalBackground.highestEducation}
                    </div>
                  </div>
                  {reservist.ridsData.educationalBackground.course && (
                    <div>
                      <div className="text-sm text-gray-500">Course</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {reservist.ridsData.educationalBackground.course}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-500">School</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {reservist.ridsData.educationalBackground.school}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Year Graduated</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {reservist.ridsData.educationalBackground.yearGraduated}
                    </div>
                  </div>
                </div>
              </div>

              {/* Occupation Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Occupation Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-500">Occupation</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {reservist.ridsData.occupationInfo.occupation}
                    </div>
                  </div>
                  {reservist.ridsData.occupationInfo.employer && (
                    <div>
                      <div className="text-sm text-gray-500">Employer</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {reservist.ridsData.occupationInfo.employer}
                      </div>
                    </div>
                  )}
                  {reservist.ridsData.occupationInfo.officeAddress && (
                    <div className="md:col-span-2">
                      <div className="text-sm text-gray-500">Office Address</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {reservist.ridsData.occupationInfo.officeAddress}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Military Training */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Military Training
                </h3>
                {reservist.ridsData.militaryTraining.length === 0 ? (
                  <p className="text-sm text-gray-500">No military training records available</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Training Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Authority
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date Completed
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reservist.ridsData.militaryTraining.map((training, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {training.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {training.authority}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {training.dateCompleted}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Special Skills */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Special Skills
                </h3>
                {reservist.ridsData.specialSkills.length === 0 ? (
                  <p className="text-sm text-gray-500">No special skills listed</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {reservist.ridsData.specialSkills.map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Awards */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Awards
                </h3>
                {reservist.ridsData.awards.length === 0 ? (
                  <p className="text-sm text-gray-500">No awards listed</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Authority
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date Awarded
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reservist.ridsData.awards.map((award, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {award.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {award.authority}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {award.dateAwarded}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Assignments */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Assignments
                </h3>
                {reservist.ridsData.assignments.length === 0 ? (
                  <p className="text-sm text-gray-500">No assignments listed</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Authority
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date From
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date To
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reservist.ridsData.assignments.map((assignment, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {assignment.authority}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {assignment.dateFrom}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {assignment.dateTo}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
} 