import React, { useState } from 'react';

const RIDSform = () => {
  const [formData, setFormData] = useState({
    // Reservist Personnel Information
    lastname: '',
    firstname: '',
    middlename: '',
    afpsn: '',
    rsvc: '',
    sourceOfCommission: '',
    branchOfService: '',
    cmd: '',
    gmt: '',
    omt: '',
    rsmt: '',
    unit: '',
    qualification: '',
    mobilizationCenter: '',
    
    // Personal Information
    presentOccupation: '',
    companyNameAddress: '',
    officeTelNo: '',
    homeAddress: '',
    townCityProvince: '',
    zipCode: '',
    resTelNo: '',
    mobileTelNo: '',
    birthdate: '',
    birthPlace: '',
    age: '',
    religion: '',
    bloodType: '',
    tin: '',
    sssNo: '',
    philhealthNo: '',
    height: '',
    weight: '',
    maritalStatus: '',
    spouse: '',
    children: '',
    fbAccount: '',
    emailAddress: '',
    specialSkills: '',
    languageDialectSpoken: '',
    
    // Military Training/Seminars/Schooling
    militarySchooling: '',
    school: '',
    dateGraduated: '',
    
    // Awards and Decoration
    awardsDecoration: '',
    authority: '',
    dateAwarded: '',
    
    // Dependents
    dependentRelation: '',
    dependentName: '',
    
    // Highest Educational Attainment
    course: '',
    educationSchool: '',
    educationDateGraduated: '',
    
    // Caadidtat/Adi
    purpose: '',
    dateStart: '',
    dateEnd: '',
    
    // Unit Assignment
    unitAssignmentUnit: '',
    unitAuthority: '',
    unitDateFrom: '',
    unitDateTo: '',
    
    // Designation
    designationAuthority: '',
    designationDateFrom: '',
    designationDateTo: ''
  });

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-4xl p-6 mx-auto font-mono text-xs bg-white">
      {/* Header */}
      <div className="mb-4 text-center">
        <div className="mb-1 text-sm font-bold">PHILIPPINE ARMY</div>
        <div className="text-sm font-bold">RESERVIST INFORMATION DATA SHEET</div>
      </div>

      {/* Instructions */}
      <div className="mb-4 text-xs">
        <div>Fill-up the form, save and send as email attachment: <span className="underline">aaresco@gmail.com</span></div>
        <div>You can also print and submit a copy of this form to your nearest CDC/RCOAARESCO</div>
      </div>

      {/* RESERVIST PERSONNEL INFORMATION */}
      <div className="mb-4 border border-black">
        <div className="p-1 text-xs font-bold text-center bg-gray-200">RESERVIST PERSONNEL INFORMATION</div>
        
        <div className="grid grid-cols-12 border-b border-black">
          <div className="col-span-3 p-1 border-r border-black">
            <div className="text-xs">Name</div>
            <div className="grid grid-cols-3 gap-1 mt-1">
              <div>
                <div className="text-xs">Last Name</div>
                <input
                  type="text"
                  value={formData.lastname}
                  onChange={(e) => handleInputChange('lastname', e.target.value)}
                  className="w-full p-1 text-xs border-b border-gray-400"
                />
              </div>
              <div>
                <div className="text-xs">First Name</div>
                <input
                  type="text"
                  value={formData.firstname}
                  onChange={(e) => handleInputChange('firstname', e.target.value)}
                  className="w-full p-1 text-xs border-b border-gray-400"
                />
              </div>
              <div>
                <div className="text-xs">Middle Name</div>
                <input
                  type="text"
                  value={formData.middlename}
                  onChange={(e) => handleInputChange('middlename', e.target.value)}
                  className="w-full p-1 text-xs border-b border-gray-400"
                />
              </div>
            </div>
          </div>
          <div className="col-span-2 p-1 border-r border-black">
            <div className="text-xs">AFPSN</div>
            <input
              type="text"
              value={formData.afpsn}
              onChange={(e) => handleInputChange('afpsn', e.target.value)}
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="col-span-2 p-1 border-r border-black">
            <div className="text-xs">RSVC</div>
            <input
              type="text"
              value={formData.rsvc}
              onChange={(e) => handleInputChange('rsvc', e.target.value)}
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="col-span-5 p-1">
            <div className="grid grid-cols-2">
              <div className="pr-2 border-r border-black">
                <div className="text-xs">Source of Commission / Enlistment</div>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <label className="flex items-center text-xs">
                    <input type="checkbox" className="mr-1" />
                    ELECTED
                  </label>
                  <label className="flex items-center text-xs">
                    <input type="checkbox" className="mr-1" />
                    ROTC
                  </label>
                  <label className="flex items-center text-xs">
                    <input type="checkbox" className="mr-1" />
                    DIRECT APPOINTED
                  </label>
                  <label className="flex items-center text-xs">
                    <input type="checkbox" className="mr-1" />
                    OCS COMMISSION
                  </label>
                  <label className="flex items-center text-xs">
                    <input type="checkbox" className="mr-1" />
                    OTHERS
                  </label>
                </div>
              </div>
              <div>
                <div className="text-xs">Branch of Service</div>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <label className="flex items-center text-xs">
                    <input type="checkbox" className="mr-1" />
                    GMT
                  </label>
                  <label className="flex items-center text-xs">
                    <input type="checkbox" className="mr-1" />
                    GME (CRCS/PN)
                  </label>
                  <label className="flex items-center text-xs">
                    <input type="checkbox" className="mr-1" />
                    OMT
                  </label>
                  <label className="flex items-center text-xs">
                    <input type="checkbox" className="mr-1" />
                    GMOT (CAFGU)
                  </label>
                  <label className="flex items-center text-xs">
                    <input type="checkbox" className="mr-1" />
                    RSMT
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12">
          <div className="col-span-2 p-1 border-r border-black">
            <div className="text-xs">Initial | Rank</div>
            <input
              type="text"
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="col-span-2 p-1 border-r border-black">
            <div className="text-xs">Date of Comm/Enlist</div>
            <input
              type="text"
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="col-span-2 p-1 border-r border-black">
            <div className="text-xs">Authority</div>
            <input
              type="text"
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="col-span-6 p-1">
            <div className="grid grid-cols-2">
              <div className="pr-2 border-r border-black">
                <div className="text-xs">Reservist Classification</div>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <label className="flex items-center text-xs">
                    <input type="checkbox" className="mr-1" />
                    I READY • RETIRED
                  </label>
                  <label className="flex items-center text-xs">
                    <input type="checkbox" className="mr-1" />
                    II STANDBY
                  </label>
                </div>
              </div>
              <div>
                <div className="text-xs">Mobilization Center</div>
                <input
                  type="text"
                  className="w-full p-1 mt-1 text-xs border-b border-gray-400"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 border-t border-black">
          <div className="col-span-2 p-1 border-r border-black">
            <div className="text-xs">Designation</div>
            <input
              type="text"
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="col-span-2 p-1 border-r border-black">
            <div className="text-xs">Squad/Team/Section</div>
            <input
              type="text"
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="col-span-2 p-1 border-r border-black">
            <div className="text-xs">Platoon</div>
            <input
              type="text"
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="col-span-2 p-1 border-r border-black">
            <div className="text-xs">Company</div>
            <input
              type="text"
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="col-span-4 p-1">
            <div className="text-xs">Battalion / Brigade / Division</div>
            <input
              type="text"
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-black">
          <div className="p-1 border-r border-black">
            <div className="text-xs">Area of Combat Specialization</div>
            <input
              type="text"
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="p-1">
            <div className="text-xs">Area / Field of BDA</div>
            <input
              type="text"
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
        </div>
      </div>

      {/* PERSONAL INFORMATION */}
      <div className="mb-4 border border-black">
        <div className="p-1 text-xs font-bold text-center bg-gray-200">PERSONAL INFORMATION</div>
        
        <div className="grid grid-cols-2 border-b border-black">
          <div className="p-1 border-r border-black">
            <div className="text-xs">Present Occupation</div>
            <input
              type="text"
              value={formData.presentOccupation}
              onChange={(e) => handleInputChange('presentOccupation', e.target.value)}
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="grid grid-cols-2">
            <div className="p-1 border-r border-black">
              <div className="text-xs">Company Name & Address</div>
              <input
                type="text"
                value={formData.companyNameAddress}
                onChange={(e) => handleInputChange('companyNameAddress', e.target.value)}
                className="w-full p-1 mt-1 text-xs border-b border-gray-400"
              />
            </div>
            <div className="p-1">
              <div className="text-xs">Office Tel No</div>
              <input
                type="text"
                value={formData.officeTelNo}
                onChange={(e) => handleInputChange('officeTelNo', e.target.value)}
                className="w-full p-1 mt-1 text-xs border-b border-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 border-b border-black">
          <div className="col-span-4 p-1 border-r border-black">
            <div className="text-xs">Home Address: Street/Barangay</div>
            <input
              type="text"
              value={formData.homeAddress}
              onChange={(e) => handleInputChange('homeAddress', e.target.value)}
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="col-span-4 p-1 border-r border-black">
            <div className="text-xs">Town/City/Province</div>
            <input
              type="text"
              value={formData.townCityProvince}
              onChange={(e) => handleInputChange('townCityProvince', e.target.value)}
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="col-span-2 p-1 border-r border-black">
            <div className="text-xs">ZIP Code</div>
            <input
              type="text"
              value={formData.zipCode}
              onChange={(e) => handleInputChange('zipCode', e.target.value)}
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="col-span-2 p-1">
            <div className="text-xs">Res Tel No</div>
            <input
              type="text"
              value={formData.resTelNo}
              onChange={(e) => handleInputChange('resTelNo', e.target.value)}
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-12 border-b border-black">
          <div className="col-span-2 p-1 border-r border-black">
            <div className="text-xs">Mobile Tel No:</div>
            <input
              type="text"
              value={formData.mobileTelNo}
              onChange={(e) => handleInputChange('mobileTelNo', e.target.value)}
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="col-span-2 p-1 border-r border-black">
            <div className="text-xs">Birthdate (mm/dd/yyyy)</div>
            <input
              type="text"
              value={formData.birthdate}
              onChange={(e) => handleInputChange('birthdate', e.target.value)}
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="col-span-3 p-1 border-r border-black">
            <div className="text-xs">Birth Place (Municipality, Province)</div>
            <input
              type="text"
              value={formData.birthPlace}
              onChange={(e) => handleInputChange('birthPlace', e.target.value)}
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="col-span-1 p-1 border-r border-black">
            <div className="text-xs">Age</div>
            <input
              type="text"
              value={formData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="col-span-2 p-1 border-r border-black">
            <div className="text-xs">Religion</div>
            <input
              type="text"
              value={formData.religion}
              onChange={(e) => handleInputChange('religion', e.target.value)}
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="col-span-2 p-1">
            <div className="text-xs">Blood Type</div>
            <input
              type="text"
              value={formData.bloodType}
              onChange={(e) => handleInputChange('bloodType', e.target.value)}
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-12 border-b border-black">
          <div className="col-span-2 p-1 border-r border-black">
            <div className="text-xs">T.I.N.</div>
            <input
              type="text"
              value={formData.tin}
              onChange={(e) => handleInputChange('tin', e.target.value)}
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="col-span-2 p-1 border-r border-black">
            <div className="text-xs">SSS No:</div>
            <input
              type="text"
              value={formData.sssNo}
              onChange={(e) => handleInputChange('sssNo', e.target.value)}
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="col-span-2 p-1 border-r border-black">
            <div className="text-xs">PHILHEALTH No:</div>
            <input
              type="text"
              value={formData.philhealthNo}
              onChange={(e) => handleInputChange('philhealthNo', e.target.value)}
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="col-span-1 p-1 border-r border-black">
            <div className="text-xs">Height: cm</div>
            <input
              type="text"
              value={formData.height}
              onChange={(e) => handleInputChange('height', e.target.value)}
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="col-span-1 p-1 border-r border-black">
            <div className="text-xs">Weight: kgs</div>
            <input
              type="text"
              value={formData.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="col-span-4 p-1">
            <div className="text-xs">Marital Status</div>
            <div className="grid grid-cols-4 gap-1 mt-1">
              <label className="flex items-center text-xs">
                <input type="checkbox" className="mr-1" />
                Single
              </label>
              <label className="flex items-center text-xs">
                <input type="checkbox" className="mr-1" />
                Married
              </label>
              <label className="flex items-center text-xs">
                <input type="checkbox" className="mr-1" />
                Widow
              </label>
              <label className="flex items-center text-xs">
                <input type="checkbox" className="mr-1" />
                Divorced
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <div className="text-xs">Spouse:</div>
                <input
                  type="text"
                  value={formData.spouse}
                  onChange={(e) => handleInputChange('spouse', e.target.value)}
                  className="w-full p-1 text-xs border-b border-gray-400"
                />
              </div>
              <div>
                <div className="text-xs">No. of Children:</div>
                <input
                  type="text"
                  value={formData.children}
                  onChange={(e) => handleInputChange('children', e.target.value)}
                  className="w-full p-1 text-xs border-b border-gray-400"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3">
          <div className="p-1 border-r border-black">
            <div className="text-xs">FB Account:</div>
            <input
              type="text"
              value={formData.fbAccount}
              onChange={(e) => handleInputChange('fbAccount', e.target.value)}
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="p-1 border-r border-black">
            <div className="text-xs">Email Address:</div>
            <input
              type="text"
              value={formData.emailAddress}
              onChange={(e) => handleInputChange('emailAddress', e.target.value)}
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
          <div className="p-1">
            <div className="text-xs">Language/Dialect Spoken:</div>
            <input
              type="text"
              value={formData.languageDialectSpoken}
              onChange={(e) => handleInputChange('languageDialectSpoken', e.target.value)}
              className="w-full p-1 mt-1 text-xs border-b border-gray-400"
            />
          </div>
        </div>

        <div className="p-1 border-t border-black">
          <div className="text-xs">Special Skills:</div>
          <input
            type="text"
            value={formData.specialSkills}
            onChange={(e) => handleInputChange('specialSkills', e.target.value)}
            className="w-full p-1 mt-1 text-xs border-b border-gray-400"
          />
        </div>
      </div>

      {/* PROMOTION/DEMOTION */}
      <div className="mb-4 border border-black">
        <div className="p-1 text-xs font-bold text-center bg-gray-200">PROMOTION/DEMOTION</div>
        <div className="grid grid-cols-3">
          <div className="p-1 border-r border-black">
            <div className="text-xs">Rank</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
          <div className="p-1 border-r border-black">
            <div className="text-xs">Date of Rank</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
          <div className="p-1">
            <div className="text-xs">Authority</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
        </div>
      </div>

      {/* MILITARY TRAINING/SEMINARS/SCHOOLING */}
      <div className="mb-4 border border-black">
        <div className="p-1 text-xs font-bold text-center bg-gray-200">MILITARY TRAINING/SEMINARS/SCHOOLING</div>
        <div className="grid grid-cols-3">
          <div className="p-1 border-r border-black">
            <div className="text-xs">Military Schooling</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
          <div className="p-1 border-r border-black">
            <div className="text-xs">School</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
          <div className="p-1">
            <div className="text-xs">Date Graduated</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
        </div>
      </div>

      {/* AWARDS AND DECORATION */}
      <div className="mb-4 border border-black">
        <div className="p-1 text-xs font-bold text-center bg-gray-200">AWARDS AND DECORATION</div>
        <div className="grid grid-cols-3">
          <div className="p-1 border-r border-black">
            <div className="text-xs">Awards/Decoration</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
          <div className="p-1 border-r border-black">
            <div className="text-xs">Authority</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
          <div className="p-1">
            <div className="text-xs">Date Awarded</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
        </div>
      </div>

      {/* DEPENDENTS */}
      <div className="mb-4 border border-black">
        <div className="p-1 text-xs font-bold text-center bg-gray-200">DEPENDENTS</div>
        <div className="grid grid-cols-2">
          <div className="p-1 border-r border-black">
            <div className="text-xs">Relation</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
          <div className="p-1">
            <div className="text-xs">Name</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
        </div>
      </div>

      {/* HIGHEST EDUCATIONAL ATTAINMENT */}
      <div className="mb-4 border border-black">
        <div className="p-1 text-xs font-bold text-center bg-gray-200">HIGHEST EDUCATIONAL ATTAINMENT</div>
        <div className="grid grid-cols-3">
          <div className="p-1 border-r border-black">
            <div className="text-xs">Course</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
          <div className="p-1 border-r border-black">
            <div className="text-xs">School</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
          <div className="p-1">
            <div className="text-xs">Date Graduated</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
        </div>
      </div>

      {/* CAADIDTAT/ADI */}
      <div className="mb-4 border border-black">
        <div className="p-1 text-xs font-bold text-center bg-gray-200">CAADIDTAT/ADI</div>
        <div className="grid grid-cols-3">
          <div className="p-1 border-r border-black">
            <div className="text-xs">Purpose / Authority</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
          <div className="p-1 border-r border-black">
            <div className="text-xs">Date Start</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
          <div className="p-1">
            <div className="text-xs">Date End</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
        </div>
      </div>

      {/* UNIT ASSIGNMENT */}
      <div className="mb-4 border border-black">
        <div className="p-1 text-xs font-bold text-center bg-gray-200">UNIT ASSIGNMENT</div>
        <div className="grid grid-cols-4">
          <div className="p-1 border-r border-black">
            <div className="text-xs">Unit</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
          <div className="p-1 border-r border-black">
            <div className="text-xs">Authority</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
          <div className="p-1 border-r border-black">
            <div className="text-xs">Date From</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
          <div className="p-1">
            <div className="text-xs">Date To</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
        </div>
      </div>

      {/* DESIGNATION */}
      <div className="mb-4 border border-black">
        <div className="p-1 text-xs font-bold text-center bg-gray-200">DESIGNATION</div>
        <div className="grid grid-cols-4">
          <div className="p-1 border-r border-black">
            <div className="text-xs">Unit</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
          <div className="p-1 border-r border-black">
            <div className="text-xs">Authority</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
          <div className="p-1 border-r border-black">
            <div className="text-xs">Date From</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
          <div className="p-1">
            <div className="text-xs">Date To</div>
            <input type="text" className="w-full p-1 mt-1 text-xs border-b border-gray-400" />
          </div>
        </div>
      </div>

      {/* Certification */}
      <div className="mb-4">
        <div className="mb-2 text-xs">I HEREBY CERTIFY that all entries in this document are correct.</div>
      </div>

      {/* Signature Section */}
      <div className="grid grid-cols-2 gap-8 mb-4">
        <div className="p-4 border border-black">
          <div className="mb-16 text-xs text-center">2x2</div>
          <div className="text-xs text-center">Photo</div>
        </div>
        <div className="p-4 border border-black">
          <div className="mb-8 text-xs text-center">RIGHT</div>
          <div className="mb-8 text-xs text-center">THUMBMARK</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-4">
        <div className="h-24 p-4 border border-black">
          <div className="text-xs text-center">SIGNATURE</div>
        </div>
        <div className="text-center">
          <div className="pb-2 mb-2 border-b border-black"></div>
          <div className="text-xs">Attesting Personnel</div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 text-xs">
        <div>This and form part of the Reservist's MPF to be filed at HQS AFPRHQ, ARESCOM and Send a Scan or E-Copy to <span className="underline">aaresco@gmail.com</span></div>
        <div>Note: Other Information that needs Supporting Documents shall be attached to this IMD</div>
        <div className="text-right">J2019</div>
      </div>
    </div>
  );
};

export default RIDSform; 