import React from 'react';
import { 
  DocumentArrowDownIcon, 
  UserIcon,
  PhoneIcon, 
  EnvelopeIcon, 
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface ReservistTableProps {
  data: any[];
  isLoading: boolean;
}

const ReservistTable: React.FC<ReservistTableProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="w-10 h-10 mx-auto border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin" />
        <p className="mt-2 text-sm text-gray-500">Loading reservist data...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center">
        <UserIcon className="w-10 h-10 mx-auto text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">No reservist data available</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
              Name
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Rank
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Service #
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Contact
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Status
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Active
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map((reservist, index) => (
            <tr key={reservist._id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                {reservist.name || `${reservist.firstName} ${reservist.lastName}`}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {reservist.rank || 'N/A'}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {reservist.serviceNumber || 'N/A'}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <div className="flex flex-col">
                  {reservist.phone && (
                    <div className="flex items-center">
                      <PhoneIcon className="w-4 h-4 mr-1 text-gray-400" />
                      <span>{reservist.phone}</span>
                    </div>
                  )}
                  {reservist.email && (
                    <div className="flex items-center mt-1">
                      <EnvelopeIcon className="w-4 h-4 mr-1 text-gray-400" />
                      <span className="truncate max-w-[150px]">{reservist.email}</span>
                    </div>
                  )}
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                  reservist.status === 'Ready' 
                    ? 'bg-green-100 text-green-800' 
                    : reservist.status === 'Standby'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {reservist.status || 'Unknown'}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {reservist.isActive ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircleIcon className="w-5 h-5 text-red-500" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReservistTable; 